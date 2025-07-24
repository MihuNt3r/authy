import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { DrizzleAsyncProvider } from '../../drizzle/drizzle.provider';
import { RegisterUserDto } from '../../dtos/users/register.dto';
import { LoginDto } from '../../dtos/users/login.dto';
import {
  EntityAlreadyExistsException,
  EntityNotFoundException,
} from '../../core/exceptions/domain-exceptions';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let mockDb: any;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test User',
    passwordHash: 'hashedPassword!123',
  };

  const mockRegisterDto: RegisterUserDto = {
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test User',
    password: 'Password!123',
  };

  const mockLoginDto: LoginDto = {
    email: 'test@example.com',
    password: 'Password!123',
  };

  beforeEach(async () => {
    // Mock database
    mockDb = {
      query: {
        users: {
          findFirst: jest.fn(),
        },
      },
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: DrizzleAsyncProvider,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    // Setup common config mock returns
    configService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'JWT_SECRET':
          return 'test-secret';
        case 'JWT_ACCESS_EXPIRATION':
          return '1h';
        default:
          return null;
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    beforeEach(() => {
      bcryptMock.genSalt.mockResolvedValue('salt' as never);
      bcryptMock.hash.mockResolvedValue('hashedPassword!123' as never);
    });

    it('should successfully register a new user', async () => {
      // Arrange
      mockDb.query.users.findFirst.mockResolvedValue(null);
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      // Act
      await service.register(mockRegisterDto);

      // Assert
      expect(mockDb.query.users.findFirst).toHaveBeenCalledWith({
        where: expect.any(Function),
      });
      expect(bcryptMock.genSalt).toHaveBeenCalledWith(10);
      expect(bcryptMock.hash).toHaveBeenCalledWith('Password!123', 'salt');
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should throw EntityAlreadyExistsException when user already exists', async () => {
      // Arrange
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        EntityAlreadyExistsException,
      );
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should handle invalid email in registration', async () => {
      // Arrange
      const invalidRegisterDto = {
        ...mockRegisterDto,
        email: 'invalid-email',
      };

      // Act & Assert
      await expect(service.register(invalidRegisterDto)).rejects.toThrow();
    });
  });

  describe('login', () => {
    beforeEach(() => {
      bcryptMock.compare.mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue('mock-jwt-token');
    });

    it('should successfully login with valid credentials', async () => {
      // Arrange
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);

      // Act
      const result = await service.login(mockLoginDto);

      // Assert
      expect(result).toEqual({ token: 'mock-jwt-token' });
      expect(mockDb.query.users.findFirst).toHaveBeenCalledWith({
        where: expect.any(Function),
      });
      expect(bcryptMock.compare).toHaveBeenCalledWith(
        'Password!123',
        'hashedPassword!123',
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          username: mockUser.username,
        },
        {
          secret: 'test-secret',
          expiresIn: '1h',
        },
      );
    });

    it('should throw EntityNotFoundException when user does not exist', async () => {
      // Arrange
      mockDb.query.users.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        EntityNotFoundException,
      );
      expect(bcryptMock.compare).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      // Arrange
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcryptMock.compare).toHaveBeenCalledWith(
        'Password!123',
        'hashedPassword!123',
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle invalid email in login', async () => {
      // Arrange
      const invalidLoginDto = {
        email: 'invalid-email',
        password: 'Password!123',
      };

      // Act & Assert
      await expect(service.login(invalidLoginDto)).rejects.toThrow();
    });
  });

  describe('getInfo', () => {
    const mockPayload = {
      sub: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      username: mockUser.username,
    };

    it('should successfully get user info with valid token', async () => {
      // Arrange
      const token = 'valid-jwt-token';
      jwtService.verifyAsync.mockResolvedValue(mockPayload);
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);

      // Act
      const result = await service.getInfo(token);

      // Assert
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        name: mockUser.name,
      });
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: 'test-secret',
      });
      expect(mockDb.query.users.findFirst).toHaveBeenCalledWith({
        where: expect.any(Function),
      });
    });

    it('should throw EntityNotFoundException when user not found after token verification', async () => {
      // Arrange
      const token = 'valid-jwt-token';
      jwtService.verifyAsync.mockResolvedValue(mockPayload);
      mockDb.query.users.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getInfo(token)).rejects.toThrow(
        EntityNotFoundException,
      );
    });

    it('should throw error when token verification fails', async () => {
      // Arrange
      const token = 'invalid-jwt-token';
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      // Act & Assert
      await expect(service.getInfo(token)).rejects.toThrow('Invalid token');
      expect(mockDb.query.users.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      // Arrange
      const password = 'testPassword';
      const salt = 'testSalt';
      const hashedPassword = 'hashedTestPassword';

      bcryptMock.genSalt.mockResolvedValue(salt as never);
      bcryptMock.hash.mockResolvedValue(hashedPassword as never);

      // Act
      const result = await service.hashPassword(password);

      // Assert
      expect(result).toBe(hashedPassword);
      expect(bcryptMock.genSalt).toHaveBeenCalledWith(10);
      expect(bcryptMock.hash).toHaveBeenCalledWith(password, salt);
    });
  });

  describe('buildPayload', () => {
    it('should build JWT payload correctly', () => {
      // Act
      const result = service.buildPayload(mockUser);

      // Assert
      expect(result).toEqual({
        sub: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        username: mockUser.username,
      });
    });
  });

  describe('generateAccessToken', () => {
    it('should generate access token correctly', () => {
      // Arrange
      const payload = { sub: 'user-123', email: 'test@example.com' };
      const expectedToken = 'generated-token';
      jwtService.sign.mockReturnValue(expectedToken);

      // Act
      const result = service.generateAccessToken(payload);

      // Assert
      expect(result).toBe(expectedToken);
      expect(jwtService.sign).toHaveBeenCalledWith(payload, {
        secret: 'test-secret',
        expiresIn: '1h',
      });
    });
  });

  describe('comparePasswords (private method testing via login)', () => {
    it('should return true for matching passwords', async () => {
      // Arrange
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue('token');

      // Act
      const result = await service.login(mockLoginDto);

      // Assert
      expect(result).toEqual({ token: 'token' });
      expect(bcryptMock.compare).toHaveBeenCalledWith(
        mockLoginDto.password,
        mockUser.passwordHash,
      );
    });

    it('should return false for non-matching passwords', async () => {
      // Arrange
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle database connection errors during registration', async () => {
      // Arrange
      mockDb.query.users.findFirst.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle database connection errors during login', async () => {
      // Arrange
      mockDb.query.users.findFirst.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle bcrypt errors during password hashing', async () => {
      // Arrange
      mockDb.query.users.findFirst.mockResolvedValue(null);
      bcryptMock.genSalt.mockRejectedValue(new Error('Bcrypt error') as never);

      // Act & Assert
      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        'Bcrypt error',
      );
    });
  });
});
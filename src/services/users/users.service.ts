import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterUserDto } from '../../dtos/users/register.dto';
import { Name } from '../../core/value-objects/name.vo';
import { Username } from '../../core/value-objects/username.vo';
import { Email } from '../../core/value-objects/email.vo';
import { Password } from '../../core/value-objects/password.vo';
import { LoginDto } from '../../dtos/users/login.dto';
import { User } from '../../core/entities/user.entity';
import * as bcrypt from 'bcrypt';

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../drizzle/schema';
import { DrizzleAsyncProvider } from '../../drizzle/drizzle.provider';
import {
  EntityAlreadyExistsException,
  EntityNotFoundException,
} from '../../core/exceptions/domain-exceptions';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const email = new Email(registerUserDto.email);
    const username = new Username(registerUserDto.username);
    const name = new Name(registerUserDto.name);
    const password = new Password(registerUserDto.password);

    this.logger.debug(
      `Attempting to register user with email: ${email.getValue()}`,
    );

    const existingUser = await this.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email.getValue()),
    });

    if (existingUser) {
      this.logger.warn(
        `Registration failed — email already exists: ${email.getValue()}`,
      );
      throw new EntityAlreadyExistsException('User', 'email');
    }

    const passwordHash = await this.hashPassword(password.getValue());

    const newUser = User.create(email, passwordHash, username, name);

    await this.db.insert(schema.users).values({
      id: newUser.id.getValue(),
      email: newUser.email.getValue(),
      username: newUser.username.getValue(),
      name: newUser.name.getValue(),
      passwordHash: newUser.passwordHash,
    });

    this.logger.log(
      `User successfully registered with ID: ${newUser.id.getValue()}`,
    );
  }

  async login(loginDto: LoginDto): Promise<{ token: string }> {
    this.logger.debug(`Attempting login for email: ${loginDto.email}`);

    const { email, password } = loginDto;

    const emailVo = new Email(email);

    const user = await this.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, emailVo.getValue()),
    });

    if (!user) {
      this.logger.warn(`Login failed: User not found for email ${email}`);
      throw new EntityNotFoundException('User');
    }

    const validPassword = await this.comparePasswords(
      password,
      user?.passwordHash,
    );

    if (!validPassword) {
      this.logger.warn(`Login failed: Invalid password for email ${email}`);
      throw new UnauthorizedException('Invalid Password');
    }

    const payload = this.buildPayload(user);
    const token = this.generateAccessToken(payload);

    // Cache the JWT token with user payload for faster getInfo operations
    const tokenCacheKey = `jwt:${token}`;
    const tokenTtl = this.getTokenTtl(); // Get TTL from JWT config or default to 1 hour
    await this.redis.setex(tokenCacheKey, tokenTtl, JSON.stringify(payload));

    this.logger.log(`Login successful for user: ${user.id}, token cached`);
    return { token };
  }

  async getInfo(token: string) {
    this.logger.debug('Verifying JWT token');

    // Check if JWT token is cached first
    const tokenCacheKey = `jwt:${token}`;
    const cachedPayload = await this.redis.get(tokenCacheKey);

    let payload: any;
    if (cachedPayload) {
      this.logger.debug('JWT token found in cache, skipping verification');
      payload = JSON.parse(cachedPayload);
    } else {
      this.logger.debug('JWT token not cached, performing verification');

      try {
        payload = await this.jwtService.verifyAsync(token, {
          secret: this.configService.get('JWT_SECRET'),
        });

        // Cache the verified JWT token payload
        const tokenTtl = this.getTokenTtl();
        await this.redis.setex(tokenCacheKey, tokenTtl, JSON.stringify(payload));

        this.logger.debug(`JWT token verified and cached: ${JSON.stringify(payload)}`);
      } catch (error) {
        this.logger.warn(`JWT token verification failed: ${error.message}`);
        throw new UnauthorizedException('Invalid token');
      }
    }

    this.logger.debug(`Fetching user with email: ${payload.email}`);

    const user = await this.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, payload.email),
    });

    if (!user) {
      this.logger.warn(`User not found for email: ${payload.email}`);
      throw new EntityNotFoundException('User');
    }

    this.logger.log(`User info retrieved for user ID: ${user.id}`);

    const { passwordHash, ...safeUser } = user;

    return safeUser;
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);

    return bcrypt.hash(password, salt);
  }

  /**
   * Generate a JWT payload with user information
   */
  buildPayload(user: {
    id: string;
    email: string;
    name: string;
    username: string;
  }): Record<string, unknown> {
    return {
      sub: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
    };
  }

  /**
   * Generate an access token
   */
  generateAccessToken(payload: Record<string, unknown>): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
    });
  }

  private async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  private getTokenTtl(): number {
    const jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN') || '1h';

    // Convert JWT expiration to seconds for Redis TTL
    if (typeof jwtExpiresIn === 'string') {
      if (jwtExpiresIn.endsWith('h')) {
        return parseInt(jwtExpiresIn) * 3600; // hours to seconds
      } else if (jwtExpiresIn.endsWith('m')) {
        return parseInt(jwtExpiresIn) * 60; // minutes to seconds
      } else if (jwtExpiresIn.endsWith('d')) {
        return parseInt(jwtExpiresIn) * 86400; // days to seconds
      } else if (jwtExpiresIn.endsWith('s')) {
        return parseInt(jwtExpiresIn); // already in seconds
      }
    }

    // Default to 1 hour if parsing fails
    return 3600;
  }
}

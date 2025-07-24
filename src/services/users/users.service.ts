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
} from '@core/exceptions/domain-exceptions';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const email = new Email(registerUserDto.email);
    const username = new Username(registerUserDto.username);
    const name = new Name(registerUserDto.name);
    const password = new Password(registerUserDto.password);

    const existingUser = await this.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email.getValue()),
    });

    if (existingUser) {
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

    console.log('User successfully inserted');
  }

  async login(loginDto: LoginDto): Promise<{ token: string }> {
    console.log({ loginDto });

    const { email, password } = loginDto;

    const emailVo = new Email(email);

    const user = await this.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, emailVo.getValue()),
    });

    if (!user) {
      throw new EntityNotFoundException('User');
    }

    const validPassword = await this.comparePasswords(
      password,
      user?.passwordHash,
    );

    if (!validPassword) {
      throw new UnauthorizedException('Invalid Password');
    }

    const payload = this.buildPayload(user);

    const token = this.generateAccessToken(payload);

    return { token };
  }

  async getInfo(token: string) {
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get('JWT_SECRET'),
    });

    console.log('JWT payload:', payload);

    const user = await this.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, payload.email),
    });

    if (!user) {
      throw new EntityNotFoundException('User');
    }

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
}

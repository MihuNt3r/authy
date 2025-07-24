import { Inject, Injectable } from '@nestjs/common';
import { RegisterUserDto } from '../../dtos/users/register.dto';
import { Name } from '@core/value-objects/name.vo';
import { Username } from '@core/value-objects/username.vo';
import { Email } from '@core/value-objects/email.vo';
import { Password } from '@core/value-objects/password.vo';
import { LoginDto } from '../../dtos/users/login.dto';
import { User } from '@core/entities/user.entity';

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../drizzle/schema';
import { DrizzleAsyncProvider } from '../../drizzle/drizzle.provider';

@Injectable()
export class UsersService {
  private readonly users: Array<User>;

  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {
    this.users = [];
  }

  async register(registerUserDto: RegisterUserDto) {
    const email = new Email(registerUserDto.email);
    const username = new Username(registerUserDto.username);
    const name = new Name(registerUserDto.name);
    const password = new Password(registerUserDto.password);

    const newUser = User.create(email, password.getValue(), username, name);

    console.log({ newUser });

    await this.db.insert(schema.users).values({
      id: newUser.id.getValue(),
      email: newUser.email.getValue(),
      username: newUser.username.getValue(),
      name: newUser.name.getValue(),
      passwordHash: newUser.passwordHash,
    });

    console.log('User successfully inserted');
  }

  async login(login: LoginDto): Promise<void> {
    console.log({ login });
    await Promise.resolve();
  }

  async getInfo() {
    const user = await this.db.query.users.findFirst({});

    return user;
  }
}

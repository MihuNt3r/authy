import { Injectable } from '@nestjs/common';
import { RegisterUserDto } from '../../dtos/users/register.dto';
import { Name } from '@core/value-objects/name.vo';
import { Username } from '@core/value-objects/username.vo';
import { Email } from '@core/value-objects/email.vo';
import { Password } from '@core/value-objects/password.vo';
import { LoginDto } from '../../dtos/users/login.dto';
import { User } from '@core/entities/user.entity';

@Injectable()
export class UsersService {
  private readonly users: Array<User>;

  constructor() {
    this.users = [];
  }

  async register(registerUserDto: RegisterUserDto): Promise<{ users: User[] }> {
    const email = new Email(registerUserDto.email);
    const username = new Username(registerUserDto.username);
    const name = new Name(registerUserDto.name);
    const password = new Password(registerUserDto.password);

    const newUser = User.create(email, password.getValue(), username, name);

    console.log({ newUser });

    this.users.push(newUser);

    return await new Promise((resolve) =>
      setTimeout(() => resolve({ users: this.users }), 2000),
    );
  }

  async login(login: LoginDto): Promise<void> {
    console.log({ login });
    await Promise.resolve();
  }

  getInfo(): Array<User> {
    return this.users;
  }
}

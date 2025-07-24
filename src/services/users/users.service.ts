import { Injectable } from '@nestjs/common';
import { RegisterUserDto } from '../../dtos/users/register.dto';
import { Email } from '@core/value-objects/email.vo';
import { Password } from '@core/value-objects/password.vo';
import { LoginDto } from '../../dtos/users/login.dto';

@Injectable()
export class UsersService {
  async register(registerUserDto: RegisterUserDto): Promise<void> {
    const email = new Email(registerUserDto.email);
    const password = new Password(registerUserDto.password);

    console.log({ email, password });

    await new Promise((resolve) =>
      setTimeout(() => resolve({ id: 'Huy' }), 2000),
    );
  }

  async login(login: LoginDto): Promise<void> {
    console.log({ login });
    await Promise.resolve();
  }

  async getInfo(): Promise<unknown> {
    const result = await new Promise((resolve) =>
      setTimeout(() => resolve({ id: 'Huy' }), 2000),
    );

    return result;
  }
}

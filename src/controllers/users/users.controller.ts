import { Controller, Get, Post } from '@nestjs/common';
import { UsersService } from '../../services/users/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register() {
    return await this.usersService.register();
  }

  @Post('login')
  async login() {
    return await this.usersService.login();
  }

  @Get('getInfo')
  async getInfo() {
    return await this.usersService.getInfo();
  }
}

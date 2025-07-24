import { Controller, Get } from '@nestjs/common';
import { UsersService } from '../../services/users/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAll() {
    return this.usersService.getUsers();
  }
}

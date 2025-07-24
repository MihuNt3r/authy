import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from '../../services/users/users.service';
import { RegisterUserDto } from '../../dtos/users/register.dto';
import { LoginDto } from '../../dtos/users/login.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email already exists',
  })
  async register(@Body() registerUserDto: RegisterUserDto) {
    return await this.usersService.register(registerUserDto);
  }

  // @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and get tokens' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'User successfully authenticated. Returns access token, refresh token, and user data. May return OTP requirement if 2FA is enabled.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto) {
    return await this.usersService.login(loginDto);
  }

  @Get('getInfo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Returns information about the authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully authenticated. Returns user data.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async getInfo() {
    return await this.usersService.getInfo();
  }
}

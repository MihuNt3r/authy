import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  async register(): Promise<void> {
    await Promise.resolve();
  }

  async login(): Promise<void> {
    await Promise.resolve();
  }

  async getInfo(): Promise<void> {
    await Promise.resolve();
  }
}

import { Module } from '@nestjs/common';
import { UsersService } from './services/users/users.service';
import { UsersController } from './controllers/users/users.controller';
import { DrizzleModule } from './drizzle/drizzle.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRATION', '15m'),
        },
      }),
    }),
    DrizzleModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health/health.controller';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // El endpoint es público y sin auth: el throttler evita que un solo cliente
    // consuma el rate limit de GitHub para todos los demás.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 30 }]),
    UserModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

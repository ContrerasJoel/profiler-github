import { Module } from '@nestjs/common';
import { CacheService } from '../common/cache.service';
import { GithubClient } from './github.client';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, GithubClient, CacheService],
})
export class UserModule {}

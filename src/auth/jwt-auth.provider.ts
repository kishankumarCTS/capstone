import { Injectable } from '@nestjs/common';
import {
  AuthenticationRegistry,
  JwtBearerProvider,
  type JwtClaims,
} from '@nestjs/authentication';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entities.js';

@Injectable()
export class JwtAuth extends JwtBearerProvider<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    registry: AuthenticationRegistry,
  ) {
    super();

    // Register JWT provider after the session provider.
    registry.registerProvider(this, { order: 1 });
  }

  // Called after JWT signature and expiration are verified.
  validate({ sub }: JwtClaims) {
    if (!sub) return null;
    return this.userRepository.findOne({
      where: {
        id: sub,
      },
    });
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AddRefreshTokenDto } from './dto/refresh-token.dto.js';
import { createHash, randomBytes } from 'crypto';
import { PasswordHasher } from '@nestjs/authentication';
import { InjectRepository } from '@nestjs/typeorm';
import {
  RefreshToken,
  RefreshTokenStatus,
} from './entities/refresh-token.entity.js';
import { Repository } from 'typeorm';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly passwordHasher: PasswordHasher,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async freshRefreshToken(addRefreshTokenDto: AddRefreshTokenDto) {
    const { user_id, refresh_token } = addRefreshTokenDto;
    const familyId = `family-${randomBytes(28).toString('hex')}`;
    const refreshTokenHash = createHash('sha256')
      .update(refresh_token)
      .digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const newRefreshToken = this.refreshTokenRepository.create({
      familyId,
      refreshTokenHash,
      user: { id: user_id },
      expiresAt,
      status: RefreshTokenStatus.ACTIVE,
    });
    await this.refreshTokenRepository.save(newRefreshToken);
    return;
  }

  async validateToken(refreshToken: string) {
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const tokenDetails = await this.refreshTokenRepository.findOne({
      where: {
        refreshTokenHash,
      },
    });

    if (!tokenDetails || tokenDetails?.status === RefreshTokenStatus.REVOKED) {
      throw new UnauthorizedException('You are not authorized.');
    }
    return tokenDetails;
  }

  async updateRefreshTokenStatus({
    refreshToken,
    status,
  }: {
    refreshToken: RefreshToken;
    status: RefreshTokenStatus;
  }) {
    refreshToken.status = status;
    await this.refreshTokenRepository.save(refreshToken);
    return;
  }

  async renewRefreshToken() {}

  async revokeRefreshToken() {}
  async invalidateRefreshToken() {}
}

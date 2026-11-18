import { TokenService } from '@nestjs/authentication';
import { User } from 'src/users/entities/user.entities.js';

export const generateTestToken = async (
  tokenService: TokenService,
  mockUserDetails: User,
) => {
  return tokenService.issue(mockUserDetails.id, {
    method: 'password',
    claims: {
      amr: ['pwd'],
      email: mockUserDetails.email,
      role: mockUserDetails.role,
    },
  });
};

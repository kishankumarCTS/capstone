import { IsNotEmpty, IsString } from 'class-validator';

export class AddRefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  user_id!: string;

  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}

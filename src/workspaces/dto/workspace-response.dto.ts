import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class WorkspaceResponseDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  owner!: string;

  @IsDateString()
  @IsNotEmpty()
  createdAt!: Date;
}

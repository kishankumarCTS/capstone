import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class UpdateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

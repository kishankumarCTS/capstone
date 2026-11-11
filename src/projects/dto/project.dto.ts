import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  workspaceId!: string;
}

export class UpdateProjectDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

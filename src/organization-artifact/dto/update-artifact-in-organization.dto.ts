import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateArtifactInOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(200)
  description?: string;

  @IsOptional()
  @IsString()
  name?: string;
}

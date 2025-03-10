import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AddArtifactToOrganizationDto {
  @IsUUID()
  @IsNotEmpty()
  artifactId: string;

  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @IsOptional()
  @IsString()
  description?: string;
}

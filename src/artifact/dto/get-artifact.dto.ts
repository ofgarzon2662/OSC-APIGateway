import { IsString, IsUUID, IsEmail } from 'class-validator';

export class GetArtifactDto {
  @IsUUID()
  id: string;

  @IsString()
  title: string;

  @IsEmail()
  submitterEmail: string;

  @IsString()
  organizationName: string;
} 
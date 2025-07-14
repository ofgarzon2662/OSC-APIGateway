import { IsString, IsUUID, IsDate, IsOptional, IsBoolean } from 'class-validator';

export class ListArtifactDto {
  @IsUUID()
  id: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDate()
  @IsOptional()
  submittedAt: Date;

  @IsBoolean()
  verified: boolean;

  @IsDate()
  @IsOptional()
  lastTimeVerified: Date;

  @IsDate()
  @IsOptional()
  lastTimeUpdated: Date;
} 
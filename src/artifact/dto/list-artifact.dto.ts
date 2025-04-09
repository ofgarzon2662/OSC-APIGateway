import { IsString, IsUUID, IsDate, IsOptional } from 'class-validator';

export class ListArtifactDto {
  @IsUUID()
  id: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDate()
  @IsOptional()
  lastTimeVerified: Date;
} 
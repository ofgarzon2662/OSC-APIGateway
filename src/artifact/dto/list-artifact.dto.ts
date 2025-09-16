import { IsString, IsUUID, IsDate, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class ListArtifactDto {
  @IsUUID()
  id: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  keywords: string[];

  @IsString()
  footprint: string;

  @IsDate()
  @IsOptional()
  submittedAt: Date;

  @IsBoolean()
  verified: boolean;

  // lastTimeVerified removed from list response

  @IsDate()
  @IsOptional()
  updatedAt: Date;
} 
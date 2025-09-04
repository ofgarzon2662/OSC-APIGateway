import { IsBoolean, IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { SubmissionState } from '../enums/submission-state.enum';

export class UpdateArtifactDto {
  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @IsDateString()
  @IsOptional()
  lastTimeVerified?: string;

  @IsEnum(SubmissionState)
  @IsOptional()
  submissionState?: SubmissionState;

  @IsDateString()
  @IsOptional()
  submittedAt?: string;

  @IsDateString()
  @IsOptional()
  lastTimeUpdated?: string;

  @IsString()
  @IsOptional()
  blockchainTxId?: string;

  @IsString()
  @IsOptional()
  peerId?: string;

  @IsString()
  @IsOptional()
  submissionError?: string;
} 
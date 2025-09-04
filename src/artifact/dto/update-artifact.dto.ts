import { IsBoolean, IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { SubmissionState } from '../enums/submission-state.enum';

export class UpdateArtifactDto {
  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @IsEnum(SubmissionState)
  @IsOptional()
  submissionState?: SubmissionState;

  @IsDateString()
  @IsOptional()
  submittedAt?: string;

  // From broker; used only when SUCCESS to update our lastTimeUpdated
  @IsDateString()
  @IsOptional()
  updatedAt?: string;

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
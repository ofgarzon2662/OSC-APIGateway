import { IsBoolean, IsDate, IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { SubmissionState } from '../enums/submission-state.enum';

export class UpdateArtifactDto {
  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @IsDate()
  @IsOptional()
  lastTimeVerified?: Date;

  @IsEnum(SubmissionState)
  @IsOptional()
  submissionState?: SubmissionState;

  @IsDateString()
  @IsOptional()
  submittedAt?: string;

  @IsString()
  @IsOptional()
  blockchainTxId?: string;

  @IsString()
  @IsOptional()
  peerId?: string;
} 
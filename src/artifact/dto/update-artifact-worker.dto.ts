import { IsBoolean, IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { SubmissionState } from '../enums/submission-state.enum';

export class UpdateArtifactWorkerDto {
  
  @IsEnum(SubmissionState)
  @IsOptional()
  submissionState?: SubmissionState;

  // From broker; used only to convey when the update happened
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
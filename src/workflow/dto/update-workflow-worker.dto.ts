import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { SubmissionState } from '../../artifact/enums/submission-state.enum';

export class UpdateWorkflowWorkerDto {
  @IsEnum(SubmissionState)
  @IsOptional()
  submissionState?: SubmissionState;

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

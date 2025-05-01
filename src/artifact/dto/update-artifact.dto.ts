import { IsBoolean, IsDate, IsEnum, IsOptional } from 'class-validator';
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

  @IsDate()
  @IsOptional()
  submittedAt?: Date;
} 
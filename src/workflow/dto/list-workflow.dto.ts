import { IsString, IsUUID, IsDate, IsOptional, IsArray, IsEnum } from 'class-validator';
import { SubmissionState } from '../../artifact/enums/submission-state.enum';

export class ListWorkflowDto {
  @IsUUID()
  id: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  keywords: string[];

  @IsEnum(SubmissionState)
  submissionState: SubmissionState;

  @IsDate()
  @IsOptional()
  submittedAt: Date;

  @IsDate()
  @IsOptional()
  updatedAt: Date;
}

import { IsString, IsUUID, IsEmail, IsArray, IsUrl, IsDate, IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { SubmissionState } from '../enums/submission-state.enum';
import { GetOrganizationDto } from './get-organization.dto';

export class GetArtifactDto {
  @IsUUID()
  id: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords: string[];

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  links: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  dois: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fundingAgencies: string[];

  @IsString()
  @IsOptional()
  acknowledgements: string;

  @IsString()
  fileName: string;

  @IsString()
  hash: string;

  @IsBoolean()
  verified: boolean;

  @IsDate()
  @IsOptional()
  lastTimeVerified: Date;

  @IsEnum(SubmissionState)
  submissionState: SubmissionState;

  @IsEmail()
  submitterEmail: string;

  @IsDate()
  @IsOptional()
  submittedAt: Date;

  @IsOptional()
  organization: GetOrganizationDto;
} 
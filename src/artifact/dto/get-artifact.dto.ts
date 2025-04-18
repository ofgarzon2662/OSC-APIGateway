import { IsString, IsUUID, IsEmail, IsArray, IsUrl, IsDate, IsBoolean, IsEnum, IsOptional, IsObject } from 'class-validator';
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
  @IsOptional()
  fileName: string;

  @IsString()
  @IsOptional()
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

  @IsString()
  submitterUsername: string;

  @IsDate()
  @IsOptional()
  submittedAt: Date;

  @IsOptional()
  organization: GetOrganizationDto;

  @IsObject()
  @IsOptional()
  submitter?: {
    id: string;
    name: string;
    username: string;
  };
} 
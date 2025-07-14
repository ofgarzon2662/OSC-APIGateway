import {
  IsString,
  IsUUID,
  IsEmail,
  IsArray,
  IsUrl,
  IsDate,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { SubmissionState } from '../enums/submission-state.enum';
import { GetOrganizationDto } from './get-organization.dto';
import { ManifestItem } from '../artifact.entity';
import { Type } from 'class-transformer';

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManifestItem)
  manifest: ManifestItem[];

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

  @IsString()
  @IsOptional()
  blockchainTxId?: string;

  @IsString()
  @IsOptional()
  peerId?: string;

  @IsString()
  @IsOptional()
  submissionError?: string;

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
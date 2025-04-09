import { IsNotEmpty, IsString, IsArray, IsUrl, IsUUID, IsEmail, Length, Matches, IsOptional, IsDate, IsBoolean, IsEnum } from 'class-validator';
import { SubmissionState } from '../enums/submission-state.enum';

export class CreateArtifactDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @Length(50, 3000)
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
  @Length(0, 4)
  @IsOptional()
  dois: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fundingAgencies: string[];

  @IsString()
  @IsOptional()
  @Length(0, 3000)
  acknowledgements: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  fileName: string;

  @IsString()
  @IsNotEmpty()
  hash: string;

  @IsUUID()
  @IsNotEmpty()
  organizationId: string;
  
  @IsDate()
  @IsOptional()
  submittedAt?: Date;
  
  @IsBoolean()
  @IsOptional()
  verified?: boolean;
  
  @IsDate()
  @IsOptional()
  lastTimeVerified?: Date;
  
  @IsEnum(SubmissionState)
  @IsOptional()
  submissionState?: SubmissionState;
} 
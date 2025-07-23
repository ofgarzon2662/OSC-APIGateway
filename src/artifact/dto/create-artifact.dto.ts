import {
  IsNotEmpty,
  IsString,
  IsArray,
  Length,
  IsOptional,
  IsDate,
  IsBoolean,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { SubmissionState } from '../enums/submission-state.enum';
import { ManifestItem } from '../artifact.entity';
import { Type } from 'class-transformer';

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
  @IsString({ each: true })
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
  @Length(0, 3000)
  acknowledgements: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManifestItem)
  manifest: ManifestItem[];

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
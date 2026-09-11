import {
  IsEnum,
  IsInt,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { DEMO_MAX_FILE_BYTES } from '../demo.constants';
import { DemoResearchContext } from '../demo.enums';

export class CreateDemoArtifactDto {
  @IsUUID('4')
  requestId: string;

  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  fingerprint: string;

  @IsInt()
  @Min(1)
  @Max(DEMO_MAX_FILE_BYTES)
  sizeBytes: number;

  @IsString()
  @Matches(/^[a-z0-9]{1,12}$/)
  extension: string;

  @IsEnum(DemoResearchContext)
  researchContext: DemoResearchContext;
}

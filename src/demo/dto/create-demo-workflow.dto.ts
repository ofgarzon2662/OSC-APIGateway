import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { DemoResearchContext } from '../demo.enums';

export class CreateDemoWorkflowDto {
  @IsUUID('4')
  requestId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  artifactIds: string[];

  @IsEnum(DemoResearchContext)
  researchContext: DemoResearchContext;
}

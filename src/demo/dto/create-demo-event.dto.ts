import { IsEnum, IsIn, IsOptional, IsUUID } from 'class-validator';
import { DemoEventName } from '../demo.enums';

const BROWSER_EVENT_NAMES = [
  DemoEventName.STATUS_VIEWED,
  DemoEventName.HISTORY_VIEWED,
  DemoEventName.SURVEY_SHOWN,
] as const;

export class CreateDemoEventDto {
  @IsEnum(DemoEventName)
  @IsIn(BROWSER_EVENT_NAMES)
  eventName: DemoEventName;

  @IsOptional()
  @IsIn(['artifact', 'workflow'])
  resourceType?: 'artifact' | 'workflow';

  @IsOptional()
  @IsUUID('4')
  resourceId?: string;
}

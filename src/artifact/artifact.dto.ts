import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ArtifactDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  body: any;

  @IsDate()
  @IsOptional()
  timeStamp: Date;
}

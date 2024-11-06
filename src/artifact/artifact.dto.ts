import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class ArtifactDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  body: any;

  @IsString()
  @IsDate()
  timeStamp: Date;
}

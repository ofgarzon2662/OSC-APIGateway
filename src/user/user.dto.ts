import { IsDate, IsNotEmpty, IsString, Validate } from 'class-validator';
import { Type } from 'class-transformer';
import { IsPastDateConstraint } from '../shared/validators/is-past-date.validators';

export class SocioDto {

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  @Validate(IsPastDateConstraint)
  fechaNacimiento: Date;

}
import { IsDate, IsNotEmpty, IsString, Validate } from 'class-validator';
import { Type } from 'class-transformer';
import { IsPastDateConstraint } from '../shared/validators/is-past-date.validators';

export class ClubDto {

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;
  
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  @Validate(IsPastDateConstraint)
  fechaFundacion: Date;

  @IsString()
  @IsNotEmpty()
  imagen: string;
}
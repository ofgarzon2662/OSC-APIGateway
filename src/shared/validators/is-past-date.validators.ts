import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isPastDate', async: false })
export class IsPastDateConstraint implements ValidatorConstraintInterface {
  validate(date: Date, args: ValidationArguments) {
    return date < new Date();
  }

  defaultMessage(args: ValidationArguments) {
    const fieldBeingValidated: string = args.property;
    return `La fecha de ${fieldBeingValidated} debe ser en el pasado.`;
  }
}

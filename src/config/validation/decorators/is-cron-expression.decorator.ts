import { registerDecorator, ValidationOptions } from 'class-validator';
import { validateCronExpression } from 'cron';

export function IsCronExpression(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyKey) => {
    registerDecorator({
      name: 'isCronExpression',
      target: target.constructor,
      propertyName: propertyKey.toString(),
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') {
            return false;
          }
          return validateCronExpression(value).valid;
        },
        defaultMessage(): string {
          return 'Value must be a valid cron expression';
        },
      },
    });
  };
}

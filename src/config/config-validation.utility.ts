import { validateSync } from 'class-validator';

export const configValidationUtility = {
  validateConfig(configInstance: object): void {
    const errors = validateSync(configInstance);

    if (errors.length > 0) {
      const sortedMessages = errors
        .map((error) => {
          const currentValue = error.value;

          const constraints = Object.values(error.constraints ?? {}).join(', ');

          return `${constraints} (current value: ${currentValue})`;
        })
        .join('; ');

      throw new Error(`Validation failed: ${sortedMessages}`);
    }
  },
  convertToBoolean(value: string | undefined) {
    const trimmedValue = value?.trim().toLowerCase();

    if (
      trimmedValue === 'true' ||
      trimmedValue === '1' ||
      trimmedValue === 'enabled'
    ) {
      return true;
    }

    if (
      trimmedValue === 'false' ||
      trimmedValue === '0' ||
      trimmedValue === 'disabled'
    ) {
      return false;
    }

    return null;
  },

  getEnumValues<T extends Record<string, string>>(enumObj: T): string[] {
    return Object.values(enumObj);
  },
};

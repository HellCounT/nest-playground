import { Injectable } from '@nestjs/common';

@Injectable()
export class MoneyMathsUtil {
  hasLessOrTwoDecimals(amount: string): boolean {
    return /^\d+([.,]\d{1,2})?$/.test(amount);
  }

  isValidAmount(amount: string): boolean {
    return (
      amount.trim() !== '' &&
      Number.isFinite(Number(amount)) &&
      Number(amount) > 0
    );
  }

  normalizeAmount(amount: string): string {
    const [integer, fraction = ''] = amount.split('.');
    const normalizedInteger = integer.replace(/^0+(?=\d)/, '');
    return `${normalizedInteger}.${fraction.padEnd(2, '0')}`;
  }
}

import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class AtLeastOneFieldPipe implements PipeTransform {
  transform(value: Record<string, unknown>) {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      !Object.values(value).some((field) => field !== undefined)
    ) {
      throw new BadRequestException('At least one field should be provided');
    }
    return value;
  }
}

import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class SanitizeIdPipe implements PipeTransform {
  transform(value: any) {
    if (
      value === 'null' ||
      value === 'undefined' ||
      value === '' ||
      value === null ||
      value === undefined
    ) {
      return undefined;
    }
    return value;
  }
}

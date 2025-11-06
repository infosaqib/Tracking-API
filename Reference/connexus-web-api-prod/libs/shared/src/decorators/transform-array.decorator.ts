import { Transform } from 'class-transformer';
import { isArray, isString } from 'class-validator';

export function TransformArray(): (target: any, key: string) => void {
  return Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (isArray(value)) {
      return value;
    }
    if (isString(value)) {
      return value.split(',').map((item) => item.trim());
    }
    return [value];
  });
}

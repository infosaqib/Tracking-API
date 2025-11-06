import { Transform } from 'class-transformer';

export function TransformBoolean() {
  return Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  });
}

export function TransformNumber() {
  return Transform(({ value }) => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return value;

    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? value : parsed;
  });
}

export function TransformStringToArray() {
  return Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  });
}

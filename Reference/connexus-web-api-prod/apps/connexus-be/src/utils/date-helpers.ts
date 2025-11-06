import { registerDecorator, ValidationArguments } from 'class-validator';

type DifferenceType = 'days' | 'hours' | 'minutes' | 'seconds';

/**
 *
 * @param date1 Date
 * @param date2 Date
 * @param type DifferenceType
 * @returns number
 * @description Get the difference between two dates
 * @example differenceInMinutes(new Date(), new Date('2021-01-01'))
 * @example differenceInMinutes(new Date(), new Date('2021-01-01'), 'days')
 * @example differenceInMinutes(new Date(), new Date('2021-01-01'), 'hours')
 * @example differenceInMinutes(new Date(), new Date('2021-01-01'), 'seconds')
 * @example differenceInMinutes(new Date(), new Date('2021-01-01'), 'minutes')
 */
export const dateDifference = (
  date1: Date,
  date2: Date,
  type: DifferenceType = 'minutes',
): number => {
  const diff = date1.getTime() - date2.getTime();
  const diffInMinutes = diff / 1000 / 60;

  switch (type) {
    case 'days':
      return diffInMinutes / 60 / 24;
    case 'hours':
      return diffInMinutes / 60;
    case 'minutes':
      return diffInMinutes;
    case 'seconds':
      return diff / 1000;
    default:
      return diffInMinutes;
  }
};

export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export function IsDateGreaterThan(
  property: string,
  validationOptions?: { message?: string },
): PropertyDecorator {
  return function validateDate(target: object, propertyKey: string | symbol) {
    registerDecorator({
      name: 'isDateGreaterThan',
      target: target.constructor,
      propertyName: propertyKey as string,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];

          if (!value || !relatedValue) {
            // If either value or relatedValue is not present, allow the entry
            return true;
          }

          const date = new Date(value);
          const relatedDate = new Date(relatedValue);

          if (
            Number.isNaN(date.getTime()) ||
            Number.isNaN(relatedDate.getTime())
          ) {
            // If either date is invalid, disallow the entry
            return false;
          }

          return dateDifference(date, relatedDate, 'days') >= 0;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return (
            validationOptions?.message ||
            `${args.property} must be after or equal to ${relatedPropertyName}`
          );
        },
      },
    });
  };
}

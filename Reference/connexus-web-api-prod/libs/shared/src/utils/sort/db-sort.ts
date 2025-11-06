import { NotAcceptableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isValidSortKey } from '../db';

const convertToNestedSort = (
  sortPath: string,
  sortDirection: 'asc' | 'desc',
) => {
  const parts = sortPath.split('.');
  const result = {};
  let current = result;

  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      current[part] = sortDirection;
    } else {
      current[part] = {};
      current = current[part];
    }
  });

  return result;
};

const validateNestedSort = (
  modelName: Prisma.ModelName,
  sortPath: string,
): boolean => {
  const parts = sortPath.split('.');
  let currentModel = modelName;

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    const dmmf = Prisma.dmmf.datamodel.models.find(
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      (m) => m.name === currentModel,
    );

    if (!dmmf) {
      return false;
    }

    const field = dmmf.fields.find((f) => f.name === part);
    if (!field) {
      return false;
    }

    // If this is the last part, it must be a sortable field
    if (i === parts.length - 1) {
      const sortableTypes = ['String', 'Int', 'Float', 'DateTime', 'Boolean'];
      const acceptedKinds = ['scalar', 'enum'];

      return (
        sortableTypes.includes(field.type) || acceptedKinds.includes(field.kind)
      );
    }

    // If not the last part, it must be a relation field
    if (field.kind !== 'object' || !field.type) {
      return false;
    }

    // Update currentModel to the related model's name for the next iteration
    currentModel = field.type as Prisma.ModelName;
  }

  return true;
};

export const getSortInputFn = ({
  sort,
  sortDirection,
  defaultSort,
  modelName,
  nestedSortLevel = 2,
}: {
  sort: string;
  sortDirection: 'asc' | 'desc';
  defaultSort?: string;
  modelName: Prisma.ModelName;
  nestedSortLevel?: number;
}) => {
  const sortParam = sort || defaultSort || 'createdAt';

  const defaultSortDirection = 'desc';

  const splittedSort = sortParam?.split('.');

  if (sortParam && !validateNestedSort(modelName, sortParam)) {
    throw new NotAcceptableException(`Invalid sort key: ${sort}`);
  }

  if (splittedSort && nestedSortLevel < splittedSort.length - 1) {
    throw new NotAcceptableException(
      `Invalid sort key: ${sortParam}, You can only sort ${nestedSortLevel + 1} level deep`,
    );
  }

  const hasId = isValidSortKey(modelName, 'id');

  const orderByArray = [
    sortParam
      ? convertToNestedSort(sortParam, sortDirection || defaultSortDirection)
      : { [defaultSort]: sortDirection || defaultSortDirection },
  ];

  if (hasId && sort !== 'id') {
    orderByArray.push({ id: defaultSortDirection });
  }

  return orderByArray as unknown;
};

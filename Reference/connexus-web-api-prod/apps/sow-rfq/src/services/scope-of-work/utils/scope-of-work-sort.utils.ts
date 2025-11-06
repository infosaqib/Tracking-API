import { Prisma } from '@prisma/client';
import { getSortInput } from '@app/shared';

const getScopeOfWorkSortInput = ({
  sort,
  sortDirection,
  defaultSort,
  modelName,
}: {
  sort?: string;
  sortDirection?: 'asc' | 'desc';
  defaultSort?: string;
  modelName: Prisma.ModelName;
}) => {
  // Special handling for status field
  if (sort === 'status') {
    return [
      { status: sortDirection || 'asc' },
      { versionNumber: 'desc' },
      { createdAt: 'desc' },
    ];
  }

  // Default sorting logic for other fields
  return getSortInput({
    sort: sort || defaultSort || 'createdAt',
    sortDirection: sortDirection || 'desc',
    defaultSort: defaultSort || 'createdAt',
    modelName,
  });
};

export default getScopeOfWorkSortInput;

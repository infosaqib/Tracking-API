import { getSortInput } from '@app/shared';
import { Prisma } from '@prisma/client';

export type GetClientScopeOfWorkSortInputArgs = Parameters<
  typeof getSortInput
>[0];

const getClientScopeOfWorkSortInput = (
  input: GetClientScopeOfWorkSortInputArgs,
) => {
  return getSortInput({
    sort: input.sort,
    sortDirection: input.sortDirection,
    modelName: Prisma.ModelName.ScopeOfWork,
    defaultSort: 'createdAt',
  });
};

export default getClientScopeOfWorkSortInput;

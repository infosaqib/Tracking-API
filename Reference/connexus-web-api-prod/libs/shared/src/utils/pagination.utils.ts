import { getSortInputFn } from './sort/db-sort';

/**
 * Get pagination input parameters
 * @param  { page, limit }
 * @returns { page, limit, includePageCount }
 */
export const getPaginationInput = ({
  page,
  limit,
}: {
  page?: number;
  limit?: number;
}) => {
  return {
    page: page || 1,
    limit: limit || 10,
    includePageCount: true,
  };
};

export const getSortInput = getSortInputFn;

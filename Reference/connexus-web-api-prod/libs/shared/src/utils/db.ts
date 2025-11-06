import { Prisma } from '@prisma/client';

export function isValidSortKey(
  model: Prisma.ModelName,
  sortKey: string,
): boolean {
  // Get the Prisma schema for the model
  const dmmf = Prisma.dmmf.datamodel.models.find((m) => m.name === model);

  if (!dmmf) {
    throw new Error(`Model ${model} not found in Prisma schema`);
  }

  // Check if the sortKey exists in the model's fields
  const field = dmmf.fields.find((f) => f.name === sortKey);

  if (!field) {
    return false;
  }

  // Check if the field type is sortable
  const sortableTypes = ['String', 'Int', 'Float', 'DateTime', 'Boolean'];
  const acceptedKinds = ['scalar', 'enum'];

  if (
    !sortableTypes.includes(field.type) &&
    !acceptedKinds.includes(field.kind)
  ) {
    return false;
  }

  return true;
}

export const isAValidDbKey = (model: Prisma.ModelName, field: string) => {
  const dmmf = Prisma.dmmf.datamodel.models.find((m) => m.name === model);

  if (!dmmf) {
    throw new Error(`Model ${model} not found in Prisma schema`);
  }

  // Check if the sortKey exists in the model's fields
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const _field = dmmf.fields.find((f) => f.name === field);

  if (!_field) {
    return false;
  }

  return true;
};

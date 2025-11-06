import { Prisma } from '@prisma/client';

export const getValidKeysInSchema = (input: {
  schema: Prisma.ModelName;
  keys: string[];
  throwError?: boolean;
}): string[] => {
  const schema = Prisma.dmmf.datamodel.models.find(
    (m) => m.name === input.schema,
  );

  if (!schema) {
    throw new Error(`Schema ${input.schema} not found`);
  }

  //   Handle Key Not Found
  if (input.throwError) {
    const invalidKeys = input.keys.filter(
      (k) => !schema.fields.find((f) => f.name === k),
    );
    if (invalidKeys.length > 0) {
      throw new Error(`Invalid keys: ${invalidKeys.join(', ')}`);
    }
  }

  return input.keys.filter((k) => schema.fields.find((f) => f.name === k));
};

export const selectValidKeys = (input: {
  schema: Prisma.ModelName;
  keys: string[];
}) => {
  const selectedKeys = getValidKeysInSchema({ ...input, throwError: false });

  const prismaSelect = Object.fromEntries(
    selectedKeys.map((k) => [k, true]),
  ) as Prisma.VendorsSelect;

  return prismaSelect;
};

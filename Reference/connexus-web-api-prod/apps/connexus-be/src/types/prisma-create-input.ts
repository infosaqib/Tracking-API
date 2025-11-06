import { Prisma } from '@prisma/client';

export type PrismaCreateInput<CreateInput, UncheckedCreateInput> =
  | (Prisma.Without<CreateInput, UncheckedCreateInput> & UncheckedCreateInput)
  | (Prisma.Without<UncheckedCreateInput, CreateInput> & CreateInput);

export type PrismaUserCreateInput = PrismaCreateInput<
  Prisma.UsersCreateInput,
  Prisma.UsersUncheckedCreateInput
>;

export type PrismaRoleCreateInput = PrismaCreateInput<
  Prisma.RolesCreateInput,
  Prisma.RolesUncheckedCreateInput
>;

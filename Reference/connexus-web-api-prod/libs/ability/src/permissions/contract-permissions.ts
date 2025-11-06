import { Actions } from '../types/actions';
import { caslSubjects } from '../types/casl-subjects';
import { CreatePermissionInput } from '../types/create-permission-input';

export const contractManagement = (input: CreatePermissionInput) => {
  const { ability } = input;
  ability.can(Actions.Manage, caslSubjects.Contract);
};

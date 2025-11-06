import { Subjects } from '@casl/prisma';
import {
  Client,
  ClientProperties,
  Contracts,
  Roles,
  Users,
} from '@prisma/client';
import { caslSubjects } from '../types/casl-subjects';

export type CaslSubject = Subjects<{
  [caslSubjects.Users]: Users;
  [caslSubjects.Roles]: Roles;
  [caslSubjects.Client]: Client;
  [caslSubjects.Property]: ClientProperties;
  [caslSubjects.VendorContact]: Contracts;
}>;

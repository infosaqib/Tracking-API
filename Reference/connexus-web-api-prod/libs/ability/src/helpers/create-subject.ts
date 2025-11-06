import { subject } from '@casl/ability';
import { ClientProperties, UserTenants } from '@prisma/client';
import { createClientSubject } from '../permissions/client-management';
import { createUserSubject } from '../permissions/connexus-user-management';
import { createPropertyContactSubject } from '../permissions/property-contact-management';
import { CaslSubject, caslSubjects } from '../types/casl-subjects';

export const createSubject = (
  caslSubject: CaslSubject,
  data: any,
  options?: { process?: boolean },
) => {
  switch (caslSubject) {
    case caslSubjects.Client:
      return createClientSubject(data);

    case caslSubjects.Users:
      return createUserSubject(data, options?.process);

    case caslSubjects.Property:
      return subject(caslSubject, data as ClientProperties);

    case caslSubjects.PropertyContact:
      return createPropertyContactSubject(data);

    case caslSubjects.VendorContact:
      return subject(caslSubjects.VendorContact, data as UserTenants);

    default:
      throw new Error('Invalid subject');
  }
};

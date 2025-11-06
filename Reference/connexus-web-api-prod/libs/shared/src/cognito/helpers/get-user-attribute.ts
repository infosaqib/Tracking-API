export type AttributeNameType =
  | 'custom:connexus_user_id'
  | 'custom:user_type'
  | 'custom:tenant_id'
  | 'email'
  | 'email_verified'
  | 'name'
  | 'family_name'
  | 'given_name'
  | 'sub';

export interface AttributeType {
  Name: AttributeNameType;

  Value?: string;
}

export const getAttribute = (userAttributes: AttributeType[]) => {
  return {
    getValue(attributeName: AttributeNameType) {
      const attribute = userAttributes.find(
        (attr) => attr.Name === attributeName,
      );
      return attribute ? attribute.Value : null;
    },
  };
};

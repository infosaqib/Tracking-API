export const formatEnum = (enumType: string) => {
  let formattedEnum = '';

  const enumValues = enumType.split('_');

  formattedEnum = enumValues
    .map((value) => value.toLocaleLowerCase())
    .join(' ');

  // Make the first letter uppercase
  formattedEnum =
    formattedEnum.charAt(0).toUpperCase() + formattedEnum.slice(1);

  return formattedEnum;
};

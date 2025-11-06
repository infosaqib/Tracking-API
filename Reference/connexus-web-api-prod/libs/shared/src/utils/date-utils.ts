export const getStartofDay = (date: string) => {
  const dateObj = new Date(date);
  return new Date(dateObj.setHours(0, 0, 0, 0));
};

export const getEndOfDay = (date: string) => {
  const dateObj = new Date(date);
  return new Date(dateObj.setHours(23, 59, 59, 999));
};

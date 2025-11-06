export const checkIsDoc = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension === 'doc' || extension === 'docx';
};

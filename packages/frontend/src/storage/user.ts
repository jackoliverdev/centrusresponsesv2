import { v4 } from 'uuid';
import { uploadPublicFile } from '.';

export const uploadUserImage = async (file: File) => {
  return await uploadPublicFile(`user-images/${v4()}`, file);
};

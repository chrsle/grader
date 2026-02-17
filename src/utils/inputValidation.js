import { MAX_FILE_SIZE, MAX_FILE_SIZE_LABEL, VALID_IMAGE_TYPES } from './constants';

export const validateImage = (file) => {
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    const supported = VALID_IMAGE_TYPES.map(t => t.replace('image/', '')).join(', ');
    throw new Error(`Invalid file type "${file.type}". Supported types: ${supported}`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size too large. Please upload an image smaller than ${MAX_FILE_SIZE_LABEL}.`);
  }
};

export const validateImages = (files) => {
  if (files.length === 0) {
    throw new Error('Please select at least one image.');
  }
  files.forEach(validateImage);
};

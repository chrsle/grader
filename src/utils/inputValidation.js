export const validateImage = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, or GIF image.');
  }
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    throw new Error('File size too large. Please upload an image smaller than 5MB.');
  }
};

export const validateImages = (files) => {
  if (files.length === 0) {
    throw new Error('Please select at least one image.');
  }
  files.forEach(validateImage);
};
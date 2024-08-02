import { extractTextFromImage } from './ocr';

export const processImagesInParallel = async (images, progressCallback) => {
  const results = [];
  const totalImages = images.length;

  for (let i = 0; i < totalImages; i++) {
    const result = await extractTextFromImage(images[i], (progress) => {
      const overallProgress = (i + progress) / totalImages;
      if (typeof progressCallback === 'function') {
        progressCallback(overallProgress);
      }
    });
    results.push(result);
  }

  return results;
};
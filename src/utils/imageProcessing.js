import { extractTextFromImage } from './ocr';

export const processImagesInParallel = async (images, progressCallback) => {
  const totalImages = images.length;
  const progressMap = new Map();

  // Initialize progress for each image
  images.forEach((_, index) => progressMap.set(index, 0));

  const updateOverallProgress = () => {
    if (typeof progressCallback !== 'function') return;

    // Calculate overall progress as the average of all individual progresses
    const totalProgress = Array.from(progressMap.values()).reduce((sum, p) => sum + p, 0);
    const overallProgress = totalProgress / totalImages;
    progressCallback(overallProgress);
  };

  // Process all images in parallel using Promise.all
  const promises = images.map((image, index) => {
    return extractTextFromImage(image, (progress) => {
      progressMap.set(index, progress);
      updateOverallProgress();
    });
  });

  const results = await Promise.all(promises);

  // Ensure we report 100% completion
  if (typeof progressCallback === 'function') {
    progressCallback(1);
  }

  return results;
};

// Sequential processing option for when order matters or to reduce memory usage
export const processImagesSequentially = async (images, progressCallback) => {
  const results = [];
  const totalImages = images.length;

  for (let i = 0; i < totalImages; i++) {
    const result = await extractTextFromImage(images[i], (progress) => {
      // Progress for current image within overall context
      const overallProgress = (i + progress) / totalImages;
      if (typeof progressCallback === 'function') {
        progressCallback(overallProgress);
      }
    });
    results.push(result);
  }

  return results;
};

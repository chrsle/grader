/* eslint-disable no-restricted-globals */
self.onmessage = async (event) => {
  const { type, data } = event.data;
  
  if (type === 'start') {
    const { images } = data;
    const totalImages = images.length;
    let processedImages = 0;
    const results = new Array(totalImages);

    for (let i = 0; i < totalImages; i++) {
      self.postMessage({ type: 'processImage', data: { index: i, image: images[i] } });
    }
  } else if (type === 'imageProcessed') {
    const { index, result } = data;
    results[index] = result;
    processedImages++;
    self.postMessage({ type: 'progress', data: { progress: processedImages / totalImages } });

    if (processedImages === totalImages) {
      self.postMessage({ type: 'result', data: results });
    }
  } else if (type === 'error') {
    console.error(`Error processing image at index ${data.index}:`, data.error);
    processedImages++;
    if (processedImages === totalImages) {
      self.postMessage({ type: 'result', data: results });
    }
  }
};
import { Worker } from 'worker_threads';

export const processImagesInParallel = async (images, processFunction) => {
  const numWorkers = Math.min(images.length, navigator.hardwareConcurrency || 4);
  const chunkSize = Math.ceil(images.length / numWorkers);
  
  const workers = [];
  for (let i = 0; i < numWorkers; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, images.length);
    const worker = new Worker('./imageProcessingWorker.js');
    workers.push(worker.run({ images: images.slice(start, end), processFunction }));
  }

  const results = await Promise.all(workers);
  return results.flat();
};
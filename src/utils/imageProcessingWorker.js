import { parentPort } from 'worker_threads';

parentPort.on('message', async ({ images, processFunction }) => {
  const results = await Promise.all(images.map(processFunction));
  parentPort.postMessage(results);
});
import { WorkerResponseMessage } from './compute-md5.worker';

interface ComputedData {
  file?: File;
  chunkList?: Blob[];
  chunkSize?: number;
}

export default function computeMD5(data: ComputedData) {
  return new Promise((resolve, reject) => {
    const woker = new Worker(
      new URL('./compute-md5.worker.ts', import.meta.url)
    );

    woker.addEventListener(
      'message',
      (e: MessageEvent<WorkerResponseMessage>) => {
        const { percent, md5, error, message } = e.data;

        if (error) {
          reject(message);
        }

        if (md5) {
          resolve(md5);
        }
      }
    );
    woker.postMessage({ ...data });
  });
}

// @ts-ignore
import Worker from './compute-md5.worker.ts';

import { WorkerResponseMessage, ComputedData } from './types';

export default function computeMD5(data: ComputedData): Promise<string> {
  return new Promise((resolve, reject) => {
    const woker = new Worker();

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

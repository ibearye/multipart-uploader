// @ts-ignore
import Worker from './compute-md5.worker.js';

interface WorkerRequestMessage {
  file?: File;
  chunkList?: Blob[];
  chunkSize?: number;
  SparkMD5?: any;
  [key: string]: any;
}

interface WorkerResponseMessage {
  percent: number;
  md5?: string;
  error?: boolean;
  message?: string;
}

interface ComputedData {
  file?: File;
  chunkList?: Blob[];
  chunkSize?: number;
}

export default function computeMD5(data: ComputedData) {
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

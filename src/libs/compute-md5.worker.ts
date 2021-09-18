// @ts-ignore
import * as SparkMD5 from 'spark-md5';

import { WorkerRequestMessage } from './types';

self.addEventListener('message', (e: MessageEvent<WorkerRequestMessage>) => {
  const {
    data: { file, chunkList, chunkSize },
  } = e;

  const spark = new SparkMD5.ArrayBuffer();

  const fileReader = new FileReader();

  let currentChunk = 0;

  const chunks = file ? Math.ceil(file.size / chunkSize) : chunkList.length;

  fileReader.addEventListener('load', (e) => {
    spark.append(e.target.result);

    const message: { percent: number; md5?: string } = {
      percent: currentChunk / chunks,
    };
    if (currentChunk >= chunks) {
      message.md5 = spark.end();
      self.postMessage(message);
      spark.destroy();
      self.close();
    } else {
      self.postMessage(message);
      loadNext();
    }
  });

  fileReader.addEventListener('error', (e) => {
    self.postMessage({});
  });

  function loadNext() {
    if (file) {
      const start = currentChunk * chunkSize;
      const end =
        start + chunkSize >= file.size ? file.size : start + chunkSize;
      fileReader.readAsArrayBuffer(file.slice(start, end));
    } else {
      fileReader.readAsArrayBuffer(chunkList[currentChunk]);
    }
    currentChunk++;
  }

  loadNext();
});

import computeMD5 from './libs/compute-md5';
import Axios, { CancelTokenSource } from 'axios';
const { CancelToken } = Axios;

const MU_PAUSE_ACTION = 'MU_PAUSE_ACTION';

import {
  MU_DEFAULT_OPTION_TYPE,
  MU_OPTION_TYPE,
  MU_EVENT_TYPE,
  MUEventListeners,
  MUBaseParams,
  MUCustomRequest,
  MUCheckParams,
  MUUploadParams,
  MUMergeParams,
  MUDefaultOptions,
  MUOptions,
} from './types';

export default class MultipartUploader {
  readonly file: File;
  readonly chunkList: Blob[] = [];
  readonly chunks: number;
  readonly uploaded: number[];
  private uploadQueue: CancelTokenSource[] = [];
  checkRes: any = null;

  active = false;

  private readonly _options: MUOptions = null;

  private listeners: MUEventListeners = {
    [MU_EVENT_TYPE.BEFORE_COMPUTE_MD5]: new Set(),
    [MU_EVENT_TYPE.FINISH_COMPUTE_MD5]: new Set(),
    [MU_EVENT_TYPE.BEFORE_UPLOAD]: new Set(),
    [MU_EVENT_TYPE.FINISH_UPLOAD]: new Set(),
    [MU_EVENT_TYPE.UPLOADING]: new Set(),
    [MU_EVENT_TYPE.PROGRESS]: new Set(),
    [MU_EVENT_TYPE.BEFORE_MERGE]: new Set(),
    [MU_EVENT_TYPE.FINISH_MERGE]: new Set(),
    [MU_EVENT_TYPE.PAUSED]: new Set(),
    [MU_EVENT_TYPE.ERROR]: new Set(),
  };

  private _md5: string;

  [key: string | symbol]: any;

  constructor(options: MUOptions) {
    this.file = options.file;
    this._options = options;

    // calculate the total chunks of file
    this.chunks = Math.ceil(this.file.size / this.options.chunkSize);

    // init propress arr
    this.uploaded = new Array(this.chunks).fill(0);

    // slice file to chunks
    for (let i = 0; i < this.chunks; i++) {
      const end =
        (i + 1) * this.options.chunkSize >= this.file.size
          ? this.file.size
          : (i + 1) * this.options.chunkSize;
      const chunk = this.file.slice(i * this.options.chunkSize, end);
      this.chunkList.push(chunk);
    }

    // compute the md5 of file
    this.computeMD5();
  }

  async computeMD5() {
    try {
      this.fire(MU_EVENT_TYPE.BEFORE_COMPUTE_MD5);
      this._md5 = (await computeMD5({
        chunkList: this.chunkList,
        chunkSize: this.chunkSize,
      })) as string;
      this.fire(MU_EVENT_TYPE.FINISH_COMPUTE_MD5, this._md5);
      return this._md5;
    } catch (err) {
      console.log('err(s) were thrown while computtting md5: ', err);
      this.fire(MU_EVENT_TYPE.ERROR, err);
    }
  }

  async assume() {
    if (!this.file) {
      this.fire(MU_EVENT_TYPE.ERROR, new Error('no any file to upload!'));

      return;
    }

    if (!this.md5) {
      this.fire(
        MU_EVENT_TYPE.ERROR,
        new Error(
          'the md5 of file has not been computted yet, or some error was fired while computting.'
        )
      );

      return;
    }

    if (this.active) {
      this.fire(
        MU_EVENT_TYPE.ERROR,
        new Error('Mission is keeping on, do not assume repeately!')
      );
      return;
    }

    this.fire(MU_EVENT_TYPE.BEFORE_UPLOAD);

    try {
      if (!this.options.checkEachChunk) {
        const {
          method = 'GET',
          headers = {},
          params = {},
          data = null,
        } = this.options.customCheckRequest({
          file: this.file,
          md5: this.md5,
          chunks: this.chunks,
        });

        this.checkRes = await Axios({
          url: this.checkApi,
          method,
          headers,
          params,
          data,
        });
      }

      const concurrentQueueCount = Math.ceil(
        this.chunkList.length / this.options.concurrentLimit
      );

      this.active = true;
      this.fire(MU_EVENT_TYPE.UPLOADING);

      for (let i = 0; i < concurrentQueueCount; i++) {
        const currentQueue = this.chunkList.slice(
          i * this.options.concurrentLimit,
          (i + 1) * this.options.concurrentLimit
        );

        await Promise.all(
          currentQueue.map(async (chunk, j) => {
            let checkRes = this.checkRes;
            const chunkNumber = i * this.options.concurrentLimit + j;

            const cancelSource = CancelToken.source();

            this.uploadQueue.push(cancelSource);

            if (this.options.checkEachChunk) {
              const {
                method = 'GET',
                headers = {},
                params = {},
                data = null,
              } = this.options.customCheckRequest({
                file: this.file,
                md5: this.md5,
                chunks: this.chunks,
                chunk,
                chunkNumber,
              });

              checkRes = await Axios({
                url: this.options.checkApi,
                method,
                headers,
                params,
                data,
                cancelToken: cancelSource.token,
              });
            }

            const shouldUpload = this.options.shouldUpload(checkRes, {
              file: this.file,
              md5: this.md5,
              chunks: this.chunks,
              chunk,
              chunkNumber,
            });

            if (shouldUpload) {
              const {
                method = 'POST',
                headers = {},
                params = {},
                data = null,
              } = this.options.customUploadRequest({
                file: this.file,
                md5: this.md5,
                chunks: this.chunks,
                chunk,
                chunkNumber,
              });

              await Axios({
                url: this.options.uploadApi,
                method,
                headers,
                params,
                data,
                cancelToken: cancelSource.token,
                onUploadProgress: (progress) => {
                  this.uploaded[chunkNumber] = progress.loaded;
                  this.fire(MU_EVENT_TYPE.PROGRESS, this.progress);
                },
              });
            } else {
              this.uploaded[chunkNumber] = chunk.size;
              this.fire(MU_EVENT_TYPE.PROGRESS, this.progress);
            }
          })
        );
      }

      this.active = false;
      this.fire(MU_EVENT_TYPE.FINISH_UPLOAD);

      if (
        this.options.shouldMerge({
          file: this.file,
          md5: this.md5,
          chunks: this.chunks,
        })
      ) {
        await this.merge();
      }
      return true;
    } catch (err) {
      if (err && err.message === MU_PAUSE_ACTION) {
        this.fire(MU_EVENT_TYPE.PAUSED);
        this.active = false;
      } else {
        this.fire(MU_EVENT_TYPE.ERROR, err);
      }
      return false;
    }
  }

  pause(): boolean {
    if (this.md5) {
      try {
        this.uploadQueue.forEach((cancelSource) =>
          cancelSource.cancel(MU_PAUSE_ACTION)
        );
        this.fire(MU_EVENT_TYPE.PAUSED);
        return true;
      } catch (err) {
        this.fire(MU_EVENT_TYPE.ERROR, err);
        return false;
      }
    }
  }

  async merge(): Promise<any> {
    try {
      this.fire(MU_EVENT_TYPE.BEFORE_MERGE);

      const {
        method = 'POST',
        headers = {},
        params = {},
        data = null,
      } = this.options.customMergeRequest({
        file: this.file,
        md5: this.md5,
        chunks: this.chunks,
      });

      const mergeRes = await Axios({
        url: this.options.mergeApi,
        method,
        headers,
        params,
        data,
      });

      this.fire(MU_EVENT_TYPE.FINISH_MERGE, mergeRes);

      return mergeRes;
    } catch (err) {
      this.fire(MU_EVENT_TYPE.ERROR, err);
    }
  }

  // unified event firer
  private fire(event: MU_EVENT_TYPE, ...params: any) {
    for (const callback of this.listeners[event]) {
      callback(...params);
    }
  }

  // listen uploader events
  on(event: MU_EVENT_TYPE, callback: Function) {
    if (event === MU_EVENT_TYPE.FINISH_COMPUTE_MD5 && this.md5) {
      callback(this.md5);
    }

    if (event === MU_EVENT_TYPE.BEFORE_COMPUTE_MD5 && !this.md5) {
      callback();
    }
    this.listeners[event].add(callback);
  }

  // unlisten uploader events
  off(event: MU_EVENT_TYPE, callback: Function) {
    this.listeners[event].delete(callback);
  }

  get md5() {
    return this._md5;
  }

  // progress uploaded
  get progress() {
    const uploaded = this.uploaded.reduce((a, b) => a + b);
    const percent = uploaded / this.file.size;
    return { uploaded, percent: percent >= 1 ? 1 : percent };
  }

  // unified options getter
  private readonly options: MUOptions = new Proxy(
    { ...this._options },
    {
      get: (_, key: MU_OPTION_TYPE) => {
        return this._options[key] || MultipartUploader.defaults[key];
      },
      set() {
        return false;
      },
    }
  );

  static defaults: MUDefaultOptions = {
    [MU_DEFAULT_OPTION_TYPE.CHUNK_SIZE]: 1024 * 1024 * 25,

    [MU_DEFAULT_OPTION_TYPE.CHECK_API]: '',
    [MU_DEFAULT_OPTION_TYPE.UPLOAD_API]: '',
    [MU_DEFAULT_OPTION_TYPE.MERGE_API]: '',
    [MU_DEFAULT_OPTION_TYPE.CHECK_EACH_CHUNK]: true,
    [MU_DEFAULT_OPTION_TYPE.CONCURRENT_LIMIT]: 8,

    [MU_DEFAULT_OPTION_TYPE.CUSTOM_CHECK_REQUEST](
      params: MUCheckParams
    ): MUCustomRequest {
      const p: { [key: string]: any } = params;
      p.filename = p.file.name;
      Reflect.deleteProperty(p, 'file');

      return {
        params: p,
      };
    },

    [MU_DEFAULT_OPTION_TYPE.CUSTOM_UPLOAD_REQUEST](
      params: MUUploadParams
    ): MUCustomRequest {
      const { chunk, chunkNumber, md5, file } = params;
      const data = new FormData();
      data.append('chunk', chunk);
      data.append('chunkNumber', String(chunkNumber));
      data.append('filename', file.name);
      data.append('md5', md5);
      return {
        data,
      };
    },

    [MU_DEFAULT_OPTION_TYPE.CUSTOM_MERGE_REQUEST](
      params: MUMergeParams
    ): MUCustomRequest {
      const { md5, file, chunks } = params;
      return { data: { md5, filename: file.name, chunks } };
    },

    [MU_DEFAULT_OPTION_TYPE.SHOULD_UPLOAD](
      checkRes: any,
      params: MUUploadParams
    ): boolean {
      return true;
    },

    [MU_DEFAULT_OPTION_TYPE.SHOULD_MERGE](params: MUBaseParams) {
      return true;
    },
  };
}

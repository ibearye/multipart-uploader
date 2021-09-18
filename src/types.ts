import { Method } from 'axios';

export interface MUCustomRequest {
  method?: Method;
  headers?: { [key: string]: any };
  params?: { [key: string]: any };
  data?: any;
}

export interface MUBaseParams {
  file: File;
  md5: string;
  chunks: number;
}

export interface MUCheckParams extends MUBaseParams {
  chunk?: Blob;
  chunkNumber?: number;
}

export interface MUUploadParams extends MUBaseParams {
  chunk: Blob;
  chunkNumber: number;
}

export interface MUMergeParams extends MUBaseParams {}

export enum MU_EVENT_TYPE {
  BEFORE_COMPUTE_MD5 = 'before-compute-md5',
  FINISH_COMPUTE_MD5 = 'finish-compute-md5',
  BEFORE_UPLOAD = 'before-upload',
  UPLOADING = 'uploading',
  FINISH_UPLOAD = 'finish-upload',
  PROGRESS = 'progress',
  BEFORE_MERGE = 'before-merge',
  FINISH_MERGE = 'finish_merge',
  PAUSED = 'paused',
  ERROR = 'error',
}

export type MUEventListeners = {
  [event in MU_EVENT_TYPE]: Set<Function>;
};

export enum MU_DEFAULT_OPTION_TYPE {
  CHUNK_SIZE = 'chunkSize',
  CHECK_API = 'checkApi',
  UPLOAD_API = 'uploadApi',
  MERGE_API = 'mergeApi',
  CHECK_EACH_CHUNK = 'checkEachChunk',
  CUSTOM_CHECK_REQUEST = 'customCheckRequest',
  CUSTOM_UPLOAD_REQUEST = 'customUploadRequest',
  CUSTOM_MERGE_REQUEST = 'customMergeRequest',
  SHOULD_UPLOAD = 'shouldUpload',
  SHOULD_MERGE = 'shouldMerge',
  CONCURRENT_LIMIT = 'concurrentLimit',
}

export enum MU_EXTRA_OPTION_TYPE {
  FILE = 'file',
}

export type MU_OPTION_TYPE = MU_EXTRA_OPTION_TYPE & MU_DEFAULT_OPTION_TYPE;

export interface MUDefaultOptions {
  chunkSize?: number;
  checkApi?: string;
  uploadApi?: string;
  mergeApi?: string;
  checkEachChunk?: boolean;
  customCheckRequest?: (params: MUCheckParams) => MUCustomRequest;
  customUploadRequest?: (params: MUUploadParams) => MUCustomRequest;
  customMergeRequest?: (params: MUMergeParams) => MUCustomRequest;
  shouldUpload?: (checkRes?: unknown, params?: MUUploadParams) => boolean;
  shouldMerge?: (params?: MUBaseParams) => boolean;
  concurrentLimit?: number;
}

export interface MUOptions extends MUDefaultOptions {
  file: File;
}

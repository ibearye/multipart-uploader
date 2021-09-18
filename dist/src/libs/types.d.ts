export interface WorkerRequestMessage {
    file?: File;
    chunkList?: Blob[];
    chunkSize?: number;
    SparkMD5?: any;
    [key: string]: any;
}
export interface WorkerResponseMessage {
    percent: number;
    md5?: string;
    error?: boolean;
    message?: string;
}
export interface ComputedData {
    file?: File;
    chunkList?: Blob[];
    chunkSize?: number;
}

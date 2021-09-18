import { MU_EVENT_TYPE, MU_Options, MU_DEFAULT_OPTIONS } from './types';
export default class MultipartUploader {
    readonly file: File;
    readonly chunkList: Blob[];
    readonly chunks: number;
    readonly uploaded: number[];
    private uploadQueue;
    private checkRes;
    active: boolean;
    private readonly _options;
    private listeners;
    private _md5;
    [key: string | symbol]: any;
    constructor(options: MU_Options);
    computeMD5(): Promise<void>;
    assume(): Promise<false | import("axios").AxiosResponse<any>>;
    pause(): boolean;
    merge(): Promise<import("axios").AxiosResponse<any>>;
    private fire;
    on(event: MU_EVENT_TYPE, callback: Function): void;
    off(event: MU_EVENT_TYPE, callback: Function): void;
    get md5(): string;
    get progress(): {
        uploaded: number;
        percent: number;
    };
    private readonly options;
    static defaults: MU_DEFAULT_OPTIONS;
}

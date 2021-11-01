import { MU_EVENT_TYPE, MUDefaultOptions, MUOptions } from './types';
export default class MultipartUploader {
    readonly file: File;
    readonly chunkList: Blob[];
    readonly chunks: number;
    readonly uploaded: number[];
    private uploadQueue;
    checkRes: any;
    active: boolean;
    private readonly _options;
    private listeners;
    private _md5;
    [key: string | symbol]: any;
    constructor(options: MUOptions);
    computeMD5(): Promise<string>;
    assume(): Promise<boolean>;
    pause(): boolean;
    merge(): Promise<any>;
    private fire;
    on(event: MU_EVENT_TYPE, callback: Function): void;
    off(event: MU_EVENT_TYPE, callback: Function): void;
    get md5(): string;
    get progress(): {
        uploaded: number;
        percent: number;
    };
    private readonly options;
    static defaults: MUDefaultOptions;
}

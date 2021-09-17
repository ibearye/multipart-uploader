# MultipartUploader

![](https://img.shields.io/npm/dy/multipart-uploader) ![](https://img.shields.io/npm/l/multipart-uploader?style=flat) ![](https://img.shields.io/npm/v/multipart-uploader)

A customizable, useful and wonderful multi-part file uploader, support "resume from break-point".

## Install

using npm:

```shell
npm i multipart-uploader
```

using CDN:

coming soon...

## Quick Start

import multipart-uploader

```javascript
import MultipartUploader from 'multipart-uploader';
```

comfigure uploader

```javascript
MultipartUploader.defaults.checkApi = 'your check api';
MultipartUploader.defaults.uploadApi = 'your upload api';
MultipartUploader.defaults.mergeApi = 'your merge api';
```

upload the file

```javascript
const uploader = new MultipartUploader({ file });
//☝️ the file is the instance of File, it usually comes from:
// const file = document.getElementById('file').files[0]

// call the method `assume` to upload file after `finish compute md5`
uploader.on('finish-compute-md5', () => {
  uploader.assume();
});
```

## API Reference

### new MultipartUploader(options)

#### options

| Option              | Type       | Requred | Default            | Desciption                                                                     |
| ------------------- | ---------- | ------- | ------------------ | ------------------------------------------------------------------------------ |
| file                | `File`     | ✅      |                    | the file to be uploaded.                                                       |
| chunkSize           | `number`   |         | `1024 * 1024 * 25` | each chunk size that divided.                                                  |
| checkApi            | `string`   |         |                    | check api.                                                                     |
| uploadApi           | `string`   |         |                    | upload api.                                                                    |
| mergeAp             | `string`   |         |                    | merge api.                                                                     |
| checkEachChunk      | `boolean`  |         | `false`            | whether request the check api for each chunk or not.                           |
| concurrentLimit     | number     |         | `8`                | how many chunks are being uploaded at a time.                                  |
| customCheckRequest  | `Function` |         | \*                 | custom the check request, the option detail is below.                          |
| customUploadRequest | `Function` |         | \*                 | custom the upload request, the option detail is below.                         |
| customMergeRequest  | `Function` |         | \*                 | custom the merge request, the option detail is below.                          |
| shouldUpload        | `Function` |         | \*                 | decide current chunk whether should upload or not, the option detail is below. |

> All options exclude `file` can be configured in `MultipartUploader.defaults`❗️❗️❗️

#### customCheckRequest

This option is a function, one param will be provided, and the param is an Object contains these properties:

1. `file: File` - the uploaded file;
2. `md5: string` - the md5 of file;
3. `chunks: number` - the count of file chunks;
4. `chunk?: Blob` - the chunk of curent upload task, this options will be provied while the `checkEachChunk` option is `true`;
5. `chunkNumber?: number` - the number of current chunk in `chunkList`. it also will be provied while the `checkEachChunk` option is `true`.

And funcion should return an Object contains these optional properties:

1. `method?: string` - request method, default is `GET` while missing;
2. `headers?: Object` - request headers, default is `{}` while missing;
3. `params?: Object` - request params, is key-value Object, default is `{}` while missing;
4. `data?: any` - request data, default is `null` while missing.

for a further understandding, here is the builtin `customCheck` function:

```javascript
function(params) {
  const p = params;
  p.filename = p.file.name;
  Reflect.deleteProperty(p, 'file');
  return {
    params: p,
  };
}
```

After understandding this option, you can configure `customUploadReqeust` and `customMergeRequest` options. they both has one param and should return an Object like the above.

#### customUploadRequest

It is very similar to customCheckRequest. the only difference is the param `chunk` and `chunkNumber` always exist.

#### customMergeRequest

the Obvious truth is that there is no things need to describe. but you should know that, the function param `chunk` and `chunkNumber` always do not exist.

#### shouldUpload

This function takes an important role in "resume from break-point", each chunk will call this function before uploading to dicide to upload or not. Two params will be provided.

The first param is the returns of checking request, it depend on you server response.

the second param is an Object contains `file`, `md5`, `chunks`, `chunk`, `chunkNumber` properties.

You should return an boolean value, true makes chunk to upload, false makes not.

This is builtin `shouldUpload` function below, obviously, it do not support "resume from break-point", it pass every chunks to be uploaded:

```javascript
function() {
  return true;
}
```

### Property

#### static `defaults`: Object

The default configurations. You can configure it and every instances of MultipartUploader will use these option.

1. `defaults.chunkSize: number`;
2. `defaults.checkApi: string`;
3. `defaults.checkEachChunk: boolean`;
4. `defaults.concurrentLimit: number`;
5. `defaults.uploadApi: string`;
6. `defaults.mergeApi: string`;
7. `defaults.customCheckRequest: Function`;
8. `defaults.customUploadRequest: Function`;
9. `defaults.customMergeRequest: Function`.

#### readonly `file`: File

equal to `options.file` passed.

#### readonly `chunkList`: Blob[]

After `new`, the file will be divided to a several amounts of single chunk, `chunkList` is a Blob Array contain these chunks.

#### readonly `chunks`: number

the chunks count of the file, equal to `chunkList.length`

#### readonly `uploaded`: number[]

chunk will be upload separately, `uploaded` is a Array cotains the each chunk's progress.

#### `active`: boolean

upload status. calling `assume` method successfully turn `active` to `true`, `pause` turn to `false`.

#### get `md5`: string

the file's md5, it is `undefined` before `finish-compute-md5`.

#### get `progress`: {uploaded: number, percent: number}

the uploading progress.

1. `uploaded` - the total size uploaded;
2. `percent` - the percent of the whole file, 0-1.

### Method

#### assume()

Start or continue to upload, it should be call after the event `finish-compute-md5` was fired.

#### pause()

Pause the upload mission.

#### on(event: string, callback: Function)

Add a listener to uploader, the function will be called while firing events related.

#### off(event, callback: Function)

Remove a listener from uploader.

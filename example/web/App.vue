<template>
  <div id="app">
    <input ref="file" type="file" name="file" id="file" />
    <br />
    <button @click="upload">upload</button>
    <br />
    <h1>upload progress: {{ progress }}%</h1>
  </div>
</template>

<script>
import MultipartUploader from 'multipart-uploader/dist/index';

MultipartUploader.defaults.checkApi = 'http://localhost:3000/upload';
MultipartUploader.defaults.uploadApi = 'http://localhost:3000/upload';
MultipartUploader.defaults.mergeApi = 'http://localhost:3000/merge';

MultipartUploader.defaults.customCheckRequest = function() {
  return {};
};

MultipartUploader.defaults.customUploadRequest = function({
  md5,
  chunk,
  chunkNumber,
}) {
  const data = new FormData();
  data.append('chunk', chunk);
  data.append('md5', md5);
  data.append('chunkNumber', chunkNumber);

  return { data };
};

MultipartUploader.defaults.customMergeRequest = function({
  file,
  md5,
  chunks,
}) {
  return { method: 'post', data: { filename: file.name, md5, chunks } };
};

export default {
  name: 'App',
  components: {},
  data() {
    return {
      progress: 0,
    };
  },
  methods: {
    upload() {
      const file = this.$refs.file.files[0];

      const uploader = new MultipartUploader({ file });
      uploader.on('finish-compute-md5', () => {
        console.log(uploader.md5);
        uploader.assume();
      });

      uploader.on('progress', ({ percent }) => {
        this.progress = percent * 100;
      });

      uploader.on('error', (err) => {
        console.log(err);
      });
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

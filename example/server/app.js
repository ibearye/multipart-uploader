const path = require('path');
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');

const fs = require('fs');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const storage = multer.memoryStorage();

app.get('/upload', (req, res) => {
  res.json({ uploaded: [], skipUpload: false });
  res.end();
});

app.post('/upload', multer({ storage }).single('chunk'), async (req, res) => {
  if (!fs.existsSync(path.join(__dirname, 'uploads', req.body.md5))) {
    fs.mkdirSync(path.join(__dirname, 'uploads', req.body.md5));
  }

  if (
    !fs.existsSync(
      path.join(__dirname, 'uploads', req.body.md5, req.body.chunkNumber)
    )
  ) {
    fs.writeFileSync(
      path.join(__dirname, 'uploads', req.body.md5, req.body.chunkNumber),
      req.file.buffer,

      () => {}
    );
  }

  console.log(`${req.body.chunkNumber} chunk upload successful. `);
  res.json({ message: 'success' });
});

app.post('/merge', (req, res) => {
  const md5 = req.body.md5;

  if (!fs.existsSync(path.join(__dirname, 'uploads', md5, req.body.filename))) {
    const filePath = path.join(__dirname, 'uploads', md5, req.body.filename);

    const file = fs.openSync(filePath, 'w+');

    for (let i = 0; i < req.body.chunks; i++) {
      const chunkPath = path.join(__dirname, 'uploads', md5, i + '');
      const chunk = fs.readFileSync(chunkPath, 'binary');
      fs.writeFileSync(file, chunk, { encoding: 'binary' });
      console.log('merge chunks successful.');
      // fs.unlink(chunkPath, () => {
      //   console.log(`unlink chunk ${i} successful.`);
      // });
    }
  }

  res.json({ message: 'success' });
});

app.listen(3000, () => {
  console.log('server is running on port 3000...');
});

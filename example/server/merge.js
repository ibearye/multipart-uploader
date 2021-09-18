const fs = require('fs');

const file = fs.openSync(
  '/Users/bearye/Desktop/express-test/uploads/878a996ab004639474d91b5a533ca7a6/video.mp4',
  'w+'
);

for (let i = 0; i < 2; i++) {
  const chunk = fs.readFileSync(
    '/Users/bearye/Desktop/express-test/uploads/878a996ab004639474d91b5a533ca7a6/' +
      i,
    {
      encoding: 'binary',
    }
  );
  fs.writeFileSync(file, chunk, { encoding: 'binary' });
}

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const file_path = path.resolve(__dirname, './thelastofus.mp4');
// file stats
const stat = fs.statSync(file_path);
const file_size = stat.size;

const server = http.createServer((req, res) => {
  const range = req.headers.range;
  if (range) {
    const parts = range.replace('bytes=', '').split('-');
    const start = parseInt(parts[0]);
    // file_size-1 because file indices begin at 0 (here we are indexing so we - 1)
    const end = parts[1] ? parseInt(parts[1]) : file_size-1;
    // (end-start)+1 to get back the one subtracted above(cuz sizing, not indexing)
    const chunk_size = (end-start)+1;
    const file_read_stream = fs.createReadStream(file_path, {start, end, highWaterMark: 120000});
    // write the appropriate headers
    const head = {
      'Content-Range': `bytes ${start}-${end}/${file_size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunk_size,
      'Content-Type': 'video/mp4',
    };
    // HTTP status code 206 means partial content
    res.writeHead(206, head);
    // pipe the contents of the read stream to a writable stream
    file_read_stream.pipe(res);
  } else {
    const head = {
      'Content-Length': file_size,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(file_path).pipe(res);
  }
});

server.listen(8080, '0.0.0.0', () => {
  console.log('Server listening on 0.0.0.0:8080');
});

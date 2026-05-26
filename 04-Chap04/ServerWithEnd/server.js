import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path,{ dirname} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('Hello, World!');
    res.end();
});

server.listen(3000);
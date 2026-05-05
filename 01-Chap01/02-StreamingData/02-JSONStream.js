import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from 'fs';
import JSONStream from 'jsonstream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const stream = fs.createReadStream(path.join(__dirname, 'BigData.json'), 'utf-8');
const parser = JSONStream.parse('*'); // dấu * nghĩa là từng phần tử trong array

stream
    .pipe(parser)
    .on('data', (data) => {
        console.log('Object:', data);
    })
    .on('end', () => {
        console.log('Hoàn thành đọc file');
    })
    .on ('error', (err) => {
        console.error('Lỗi khi đọc file json:', err);
    });

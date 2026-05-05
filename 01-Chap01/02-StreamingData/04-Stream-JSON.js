import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from 'fs';
import streamJson from 'stream-json';
import streamArrayModule from 'stream-json/streamers/StreamArray.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { parser } = streamJson;
const { streamArray } = streamArrayModule;
const stream = fs.createReadStream(path.join(__dirname, 'BigData.json'), 'utf-8');

stream
    .pipe(parser())
    .pipe(streamArray())
    .on('data', ({ key, value }) => {
        console.log(`Object ${key}`, value);
    })
    .on('end', () => {
        console.log('Hoàn thành đọc file');
    })
    .on ('error', (err) => {
        console.error('Lỗi khi đọc file json:', err);
    });

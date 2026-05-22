import chokidar from 'chokidar';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

//Khai báo biến lưu đường dẫn tuyệt đối
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const watchDir = path.join(__dirname, 'watch');
const processDir = path.join(__dirname, 'done');

const watcher = chokidar.watch(watchDir, {
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
    }
});

function handleFile(filePath){
    const file = path.basename(filePath);
    const dest = path.join(processDir, file.toLowerCase());

    fs.rename(filePath, dest, err => {
        if (err) console.error(err);
        else console.log(`Processed: ${file} => ${file.toLowerCase()}`);
    });
}

watcher
    .on('add', handleFile)
    .on('change', handleFile);
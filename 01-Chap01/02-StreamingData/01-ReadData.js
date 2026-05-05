import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var stream = fs.createReadStream(path.join(__dirname, 'Data.json'));
var jsonStr = '';

stream.on('data', (chunk) =>{
    jsonStr += chunk;
    console.log('Chunk:', chunk.length, 'bytes');
})
.on('end', () => {
    try{
        const data = JSON.parse(jsonStr);        
        console.log('Hoàn thất đọc file. Nội dung file:', data);
    }
    catch (e){
        console.error('JSON lỗi:', e);
    }    
})
.on('error', (err) => {
    console.error('Lỗi đọc file:', err);
});
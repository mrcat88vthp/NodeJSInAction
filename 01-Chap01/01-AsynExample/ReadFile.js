import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

fs.readFile(path.join(__dirname,'Data.json'), 'utf-8', (err, data) => {
    if (err) {
        console.error('Lỗi khi đọc file:', err);
        return;
    }
    try{
        let dataJSon = JSON.parse(data);
        console.log('dữ liệu trong file Data.json:', dataJSon);
    }
    catch(e){
        console.error('Lỗi khi in:', e);
    }
    
})
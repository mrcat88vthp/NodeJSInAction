import Watcher from "./Watcher.js";
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

//Khai báo biến lưu đường dẫn tuyệt đối
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const watcher = new Watcher(path.join(__dirname, 'watch'), path.join(__dirname, 'done'));

watcher.on('process', function process(file){
    setTimeout(() => {    
        var sourceDir = path.join(this.watchDir, file);
        var destDir = path.join(this.processedDir, file.toLowerCase());

        if (!fs.existsSync(sourceDir)){
            console.warn(`⚠️ File not found, skipping: ${file}`);
            return;
        }

        fs.rename(sourceDir, destDir, function(err){
            if (err) {
                console.error(`❌ Rename failed for ${file}: ${err.message}`);
                return;
            }
            console.log(`✅ Processed: ${file} → ${file.toLowerCase()}`);
        });
    }, 3000);
});

watcher.start();
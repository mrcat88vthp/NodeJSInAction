import { EventEmitter } from 'events';
import path from 'path';
import { readdir, watch} from 'fs';

//Định nghĩa class Watcher kế thừa từ EventEmitter
export default class Watcher extends EventEmitter{
    constructor(watchDir, processedDir){
        super();
        this.watchDir = watchDir;
        this.processedDir = processedDir;
    }

    //Đọc file trong thư mục và phát sự kiện "process"
    watch(){
        readdir(this.watchDir, (err, files) => {
            if (err) throw err;
            for(const file of files){
                this.emit('process', file);
            }
        });
    }

    //Bắt đầu theo dõi thư mục, khi có thay đổi gọi watch()
    start() {
        watch(this.watchDir, (eventType, filename) => {
            if (filename){
                console.log(`Detected change: ${filename} (${eventType})`);
                this.watch();
            }
        });

        console.log(`Watching directory: ${this.watchDir}`);
    }
}
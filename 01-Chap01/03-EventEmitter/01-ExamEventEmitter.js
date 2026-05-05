import { EventEmitter } from "events";

const myEmitter = new EventEmitter();

//Đăng ký lắng nghe
myEmitter.on('greeting', (name) => {
    console.log(`Hello ${name}`);
});

//Phát sự kiện.
myEmitter.emit('greeting', 'Dũng');
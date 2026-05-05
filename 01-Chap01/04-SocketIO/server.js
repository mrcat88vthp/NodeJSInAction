import http from 'http';
import { Server } from 'socket.io';
import express from 'express';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const app = express();

//Bắt buộc để gắn Socket.IO vào HTTP server.
const server = http.createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//Phục vụ file tĩnh(index.html, client.js)
app.use(express.static(path.join(__dirname, 'public')));

//Sự kiện connection(socket): mỗi client mới kết nối sẽ có một socket riêng (đại diện cho kết nối đó).
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    //Đăng ký sự kiện nhận tin nhắn gửi từ client
    socket.on('chatMessage', (msg) => {
        console.log(`Received: ${msg}`);

        //Phát cho tất cả client, bao gồm người gửi.
        //io.emit('chatMessage', msg); 

        //Phát chỉ cho người gửi.
        //socket.emit('chatMessage', msg);

        //Gửi cho tất cả client khác, trừ người gửi.
        socket.broadcast.emit('chatMessage', msg);
    });

    socket.on('disconnect', (reason) => {
        console.log(`Client ${socket.id} disconnected: ${reason}`);
    });
    
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
})

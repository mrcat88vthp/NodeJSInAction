//1. Import Socket.IO
import {Server} from 'socket.io';

//2. Khai báo các biến để quản lý state.
let io;
let guestNumber = 1; // đếm số khách để đặt tên Guest1, Guest2, ...
const nickNames = {}; // lưu mapping socket.id -> nickname
const namesUsed = []; // lưu danh sách tên đã dùng
const currentRoom = {}; // lưu mapping socket.id -> room hiện tại

//3. Hàm listen(server) khởi tạo Socket.IO server
export function listen(server){
    io = new Server(server);

    io.on('connection', (socket) => {
        //Khi có client mới kết nối, gán tên cho client và tăng guestNumber
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

        //Tham gia room 'mac_dinh'
        joinRoom(socket, 'mac_dinh');

        //Đăng ký các sự kiện từ Client
        handleMessageBroadcasting(socket, nickNames);

        //Client yêu cầu xem danh sách phòng
        socket.on('rooms', () => {
            const rooms = {};
            for(const [id, socketObj] of io.sockets.sockets){
                const roomNames = [...socketObj.rooms].filter(r => r !== id);
                rooms[id] = roomNames;
            }

            socket.emit('rooms', rooms);
        });

        handleDisconnect(socket, nickNames, namesUsed);
    });
}

//4. Các hàm helper: 
//Hàm gán tên khách
function assignGuestName(socket, guestNumber, nickNames, namesUsed){
    const name = 'Guest' + guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult', {success: true, name});
    namesUsed.push(name);
    return guestNumber + 1;
}

//Hàm join Room
function joinRoom(socket, room){
    socket.join(room);
    currentRoom[socket.id] = room;

    //Trả về thông tin cho client đã join room
    socket.emit('joinResult', {room});

    //Trả về thông tin cho các client khác trong room, có user vừa join.
    socket.broadcast.to(room).emit('message', {
        text: `${nickNames[socket.id]} has join ${room}`
    });
}

//Hàm đổi tên nick


//Hàm nhận tin nhắn và gửi lên room
function handleMessageBroadcasting(socket, nickNames) {
    console.log(io.sockets.adapter.rooms);
    socket.on('message', (message) => {
        socket.broadcast.to(message.room).emit('mesage', {            
            text: `${nickNames[socket.id]}: ${message.text}`
        });
    });
}

//Hàm xử lý mất kết nối
function handleDisconnect(socket) {
    socket.on('disconnnect', () => {
        const nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        if (nameIndex !== -1) namesUsed.splice(nameIndex, 1);
        delete nickNames[socket.id];
        delete currentRoom[socket.id];
    });
}
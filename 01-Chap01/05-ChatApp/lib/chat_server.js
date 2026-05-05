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

        //Tham gia room 'Lobby'
        joinRoom(socket, 'Lobby');

        //Đăng ký các sự kiện từ Client
        handleMessageBroadcasting(socket, nickNames);
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);

        //Client yêu cầu xem danh sách phòng
        socket.on('rooms', () => {
            const allRooms = [...io.sockets.adapter.rooms.keys()].filter(r => !io.sockets.sockets.has(r));

            //Loại bỏ trùng = set
            const uniqueRooms = [...new Set(allRooms)];

            socket.emit('rooms', uniqueRooms);
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

    //Nếu trong room có nhiều user, gửi danh sách cho client vừa join.
    const userInRoom = [...io.sockets.adapter.rooms.get(room) || []];
    if (userInRoom.length > 1){
        let usersInRoomSummary = `Users current in ${room}: `;
        userInRoom.forEach((item, index) => {            
            if (index > 0) usersInRoomSummary += ', ';
            usersInRoomSummary += nickNames[item];
        });
        usersInRoomSummary += '.';
        socket.emit('message', {text: usersInRoomSummary});
    }
}

//Hàm đổi tên nick
function handleNameChangeAttempts(socket, nickNames, namesUsed){
    socket.on('nameAttempt', (name) => {
        if (name.startsWith('Guest')) {
            socket.emit('nameResult', {
                success: false,
                message: 'Name can not begin with "Guest"'
            });
        }
        else {
            if (!namesUsed.includes(name)){
                const previousName = nickNames[socket.id];
                const previousIndex = namesUsed.indexOf(previousName);

                namesUsed.push(name);
                nickNames[socket.id] = name;
                if(previousIndex !== -1) 
                    namesUsed.splice(previousIndex, 1);

                socket.emit('nameResult', {success: true, name});
                socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                    text: `${previousName} is now known ${name}`
                });
            }
            else {
                socket.emit('nameResult', {
                    success: false,
                    message: 'That name is already in used'
                })
            }
        }
    });
}

//Hàm nhận tin nhắn và gửi lên room
function handleMessageBroadcasting(socket, nickNames) {    
    socket.on('message', (message) => {
        socket.broadcast.to(message.room).emit('message', {            
            text: `${nickNames[socket.id]}: ${message.text}`
        });
    });
}

//Hàm xử lý join room
function handleRoomJoining(socket) {
    socket.on('join', (room) => {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
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
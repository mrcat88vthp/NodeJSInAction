import { Server } from "socket.io";
export class SocketIOGateway {
    io;
    constructor(io) {
        this.io = io;
        // Initialize the Socket.IO server here if needed
    }
    emitToClient(socketId, eventName, data) {
        // Emit đến đúng room của socketId
        // Socket.IO tự join room tên là socket.id khi connect
        this.io.to(socketId).emit(eventName, data);
    }
}
//# sourceMappingURL=SocketIOGateway.js.map
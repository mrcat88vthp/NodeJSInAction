import { Server } from "socket.io";
import type { ISocketGateway } from "@/domain/gateway/ISocketGateway.js";

export class SocketIOGateway implements ISocketGateway {
    constructor(private readonly io: Server) {
        // Initialize the Socket.IO server here if needed
    }
    
    emitToClient (
        socketId: string,
        eventName: string,        
        data: unknown
    ): void {
        // Emit đến đúng room của socketId
        // Socket.IO tự join room tên là socket.id khi connect
        this.io.to(socketId).emit(eventName, data);
    }
}
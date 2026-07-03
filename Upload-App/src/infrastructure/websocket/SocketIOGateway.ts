import { Server } from "socket.io";
import type { ISocketGateway } from "@/domain/gateway/ISocketGateway.js";

export class SocketIOGateway implements ISocketGateway {
    constructor(private readonly io: Server) {
        // Initialize the Socket.IO server here if needed
    }
    
    async emitToClient (
        socketId: string,
        eventName: string,        
        data: unknown
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const io = new Server();
                io.to(socketId).emit(eventName, data);
                resolve();
            } catch (error) {
                reject(error);
            }   
        });
    }
}
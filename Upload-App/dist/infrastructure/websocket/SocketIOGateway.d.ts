import { Server } from "socket.io";
import type { ISocketGateway } from "../../domain/gateway/ISocketGateway.js";
export declare class SocketIOGateway implements ISocketGateway {
    private readonly io;
    constructor(io: Server);
    emitToClient(socketId: string, eventName: string, data: unknown): void;
}
//# sourceMappingURL=SocketIOGateway.d.ts.map
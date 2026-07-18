export interface ISocketGateway {
    emitToClient(socketId: string, eventName: string, data: unknown): void | Promise<void>;
}
//# sourceMappingURL=ISocketGateway.d.ts.map
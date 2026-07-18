import { UploadProgressEvent } from '../../../domain/events/UploadProgressEvent.js';
export class UploadProgressHandler {
    socketGateway;
    constructor(socketGateway) {
        this.socketGateway = socketGateway;
    }
    handle(event) {
        const { socketId, ...data } = event.payload;
        this.socketGateway.emitToClient(socketId, event.eventName, {
            ...data,
            occurredAt: event.occurredAt.toISOString(),
        });
    }
}
//# sourceMappingURL=UploadProgressHandler.js.map
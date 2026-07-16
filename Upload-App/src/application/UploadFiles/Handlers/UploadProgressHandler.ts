import { UploadProgressEvent } from '@/domain/events/UploadProgressEvent.js';
import type {IEventHandler} from '@/domain/events/IEventHandler.js';
import type { ISocketGateway } from '@/domain/gateway/ISocketGateway.js';

export class UploadProgressHandler implements IEventHandler<UploadProgressEvent> {
    constructor(private readonly socketGateway: ISocketGateway) {}

    handle(event: UploadProgressEvent): void {

        const {socketId, ...data} = event.payload;

        this.socketGateway.emitToClient(
            socketId,
            event.eventName,
            {
                ...data,
                occurredAt: event.occurredAt.toISOString(),
            },
        );
    }
}
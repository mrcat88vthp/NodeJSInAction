import { UploadProgressEvent } from '../../../domain/events/UploadProgressEvent.js';
import type { IEventHandler } from '../../../domain/events/IEventHandler.js';
import type { ISocketGateway } from '../../../domain/gateway/ISocketGateway.js';
export declare class UploadProgressHandler implements IEventHandler<UploadProgressEvent> {
    private readonly socketGateway;
    constructor(socketGateway: ISocketGateway);
    handle(event: UploadProgressEvent): void;
}
//# sourceMappingURL=UploadProgressHandler.d.ts.map
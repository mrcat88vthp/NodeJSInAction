import { type IDomainEvent } from "./IDomainEvent.js";
import type { UploadProgressPayload } from "../../domain/events/UploadProgressType.js";
export declare class UploadProgressEvent implements IDomainEvent {
    readonly payload: UploadProgressPayload;
    readonly eventName: "upload.progress";
    readonly occurredAt: Date;
    constructor(payload: UploadProgressPayload);
}
//# sourceMappingURL=UploadProgressEvent.d.ts.map
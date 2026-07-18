import { type IDomainEvent } from "./IDomainEvent.js";
import type { UploadProgressPayload } from "@/domain/events/UploadProgressType.js";

export class UploadProgressEvent implements IDomainEvent {
    readonly eventName = "upload.progress" as const;
    readonly occurredAt = new Date();

    constructor(readonly payload: UploadProgressPayload) {

    }
}
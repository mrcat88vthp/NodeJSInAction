import {} from "./IDomainEvent.js";
export class UploadProgressEvent {
    payload;
    eventName = "upload.progress";
    occurredAt = new Date();
    constructor(payload) {
        this.payload = payload;
    }
}
//# sourceMappingURL=UploadProgressEvent.js.map
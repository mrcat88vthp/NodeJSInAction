import { type IDomainEvent } from "./IDomainEvent.js";

export type UploadStatus = "uploading" | "completed" | "failed";

export interface UploadProgressPayload {
    readonly socketId: string; //Client nào nhận được thông báo.
    readonly fileName: string; //Tên file đã được sanitize.
    readonly uploaded: number; //Số byte đã upload.
    readonly total: number; //Tổng số byte của file (= 0: không biết)
    readonly percent: number; //Phần trăm đã upload (0-100)
    readonly status: UploadStatus; //Trạng thái upload
}

export class UploadProgressEvent implements IDomainEvent {
    readonly eventName = "upload.progress" as const;
    readonly occurredAt = new Date();

    constructor(readonly payload: UploadProgressPayload) {

    }
}
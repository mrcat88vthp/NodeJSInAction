export type UploadStatus = "uploading" | "completed" | "failed";
export interface UploadProgressPayload {
    readonly socketId: string;
    readonly fileName: string;
    readonly uploaded: number;
    readonly total: number;
    readonly percent: number;
    readonly status: UploadStatus;
}
//# sourceMappingURL=UploadProgressType.d.ts.map
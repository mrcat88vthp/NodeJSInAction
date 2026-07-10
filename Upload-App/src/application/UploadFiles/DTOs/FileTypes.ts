import { Readable } from "stream";

export type UploadFileInputDTO = {
    stream: Readable,
    fileName: string,
    mimeType: string,
    totalSize: number,
    socketId: string
}

export type UploadFileOutputDTO = {
    originalFileName: string,
    saveFileName: string,
    fileSize: number,
    filePath: string
}
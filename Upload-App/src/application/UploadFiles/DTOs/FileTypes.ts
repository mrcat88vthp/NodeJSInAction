export type UploadFileInputDTO = {
    stream: NodeJS.ReadableStream,
    fileName: string,
    mimeType: string,
    totalSize: number,
    socketId: string
}

export type UploadFileOutputDTO = {
    fileName: string,
    fileSize: number,
    filePath: string
}
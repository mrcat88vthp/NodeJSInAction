export interface IFileStorage {
    saveFile (
        fileName: string,
        stream: NodeJS.ReadableStream,
    ): Promise<string>;
}
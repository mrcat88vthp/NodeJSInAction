import type { IFileStorage } from '../../../domain/repositories/IFileStorage.js';
import type { MetaDataFile } from '../../../infrastructure/repositories/storage/DTOs/MetaDataFile.js';
export declare class LocalFileStorage implements IFileStorage {
    private writeQueue;
    private static _uploadPath;
    private static _metadataFilePath;
    private constructor();
    static create(uploadPath: string, metadataFilePath: string): Promise<LocalFileStorage>;
    saveFile(file: MetaDataFile, stream: NodeJS.ReadableStream): Promise<string>;
    private readMetadataFile;
    private saveLogUpload;
}
//# sourceMappingURL=LocalFileStorage.d.ts.map
import type { MetaDataFile } from '../../infrastructure/repositories/storage/DTOs/MetaDataFile.js';
export interface IFileStorage {
    saveFile(file: MetaDataFile, stream: NodeJS.ReadableStream): Promise<string>;
}
//# sourceMappingURL=IFileStorage.d.ts.map
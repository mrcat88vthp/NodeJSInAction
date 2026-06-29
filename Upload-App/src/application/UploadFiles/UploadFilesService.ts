import type { IFileStorage } from '@/domain/repositories/IFileStorage.js';
import 

export class UploadFilesService {
    constructor(
        private fileStorage: IFileStorage
    ) {}

    UploadFile (
        fileName: string,
        stream: NodeJS.ReadableStream,
        size: number
    ) {
        const pathFile = this.fileStorage.saveFile(fileName, stream);

        return 
    }
}
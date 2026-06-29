import type { IFileStorage } from '@/domain/repositories/IFileStorage.js';
import { UploadedFile } from '@/domain/entities/UploadedFile.js';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/shared/constants/file.js';
import { type FileException, FileErrorCodes } from '@/application/DTOs/UploadFiles/FileException.js';
import path from 'path';

export class UploadFilesService {
    constructor(
        private fileStorage: IFileStorage
    ) {}

    async UploadFile (
        fileName: string,
        stream: NodeJS.ReadableStream,
        size: number
    ) {
        validateFileSize(size);
        validateFileType(fileName);

        const pathFile = await this.fileStorage.saveFile(fileName, stream);

        return new UploadedFile(fileName, size, pathFile);
    }
}

function validateFileSize(size: number) {
    if (size > MAX_FILE_SIZE) {
        const error: FileException = {
            errorCode: FileErrorCodes.FILE_SIZE_EXCEEDED,
            errorMessage: `File size exceeds the maximum limit of ${MAX_FILE_SIZE} bytes.`
        };

        throw new Error(JSON.stringify(error, null, 2));
    }
}

function validateFileType(fileName: string) {
    const ext = path.extname(fileName).toLowerCase();

    if (!ALLOWED_FILE_TYPES.hasOwnProperty(ext)) {
        const error: FileException = {
            errorCode: FileErrorCodes.INVALID_FILE_TYPE,
            errorMessage: `File type ${ext} is not allowed.`
        };
        
        throw new Error(JSON.stringify(error, null, 2));
    }
}
import type { IFileStorage } from '@/domain/repositories/IFileStorage.js';
import type { IEventBus } from '@/domain/events/IEventBus.js';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/shared/constants/file.js';
import { type FileException, FileErrorCodes } from '@/application/UploadFiles/DTOs/FileException.js';
import type { UploadFileInputDTO, UploadFileOutputDTO } from '@/application/UploadFiles/DTOs/FileTypes.js';
import { UploadProgressEvent, type UploadProgressPayload } from '@/domain/events/UploadProgressEvent.js';
import path from 'path';
import { PassThrough } from 'stream';

export class UploadFilesService {
    constructor(
        private readonly fileStorage: IFileStorage,
        private readonly eventBus: IEventBus
    ) {}

    async UploadFile (
        input: UploadFileInputDTO
    ): Promise<UploadFileOutputDTO> {
        const {stream, fileName, mimeType, totalSize, socketId} = input;

        //1. validate bussiness rules
        this.validateFile(fileName, totalSize);

        //2. Tạo tên file safe
        const safeName = this.generateSafeFileName(fileName);

        // 3. Thông báo bắt đầu
        this.publish({
            socketId,
            fileName: safeName,
            uploaded: 0,
            total: totalSize,
            percent: 0,
            status: 'uploading'
        });

        try {
            // 4. Bọc stream với progress tracking
            //    PassThrough đứng giữa: source → PassThrough → writeStream
            //    Mỗi chunk qua PassThrough → publish event
            const trackedStream = this.createTrackedStream(
                stream,
                {
                    socketId,
                    fileName: safeName,
                    totalSize
                }
            );

            // 5. Lưu file — UseCase không biết lưu đâu (local / S3 / GCS)
            const filePath = await this.fileStorage.saveFile(safeName, trackedStream);

            // 6. Thông báo hoàn tất
            this.publish({
                socketId,
                fileName: safeName,
                uploaded: totalSize,
                total: totalSize,
                percent: 100,
                status: 'completed'
            });

            const result: UploadFileOutputDTO = {
                fileName, 
                fileSize: totalSize, 
                filePath: filePath
            };

            return result;
        }
        catch (error) {
            this.publish({
                socketId,
                fileName: safeName,
                uploaded: 0,
                total: totalSize,
                percent: 0,
                status: 'failed'
            });

            throw error;
        }
    }

    // ── Private helpers ──────────────────────────────────────────

    /*
        * Tạo PassThrough stream để đo bytes đang chảy qua.
        * source → [PassThrough] → fileStorage.save()
        *                ↓ mỗi chunk
        *          publish event (không block stream)
    */
    private createTrackedStream(
        source: NodeJS.ReadableStream,
        options: {
            socketId: string, 
            fileName: string, 
            totalSize: number
        }
    ): PassThrough {
        const { socketId, fileName, totalSize } = options;
        let uploadedBytes = 0;    
        let lastPercent = -1;    

        const passThrough = new PassThrough();

        passThrough.on('data', (chunk: Buffer) => {
            uploadedBytes += chunk.length;
            const percent = totalSize > 0 
                ? Math.min(99, Math.round((uploadedBytes / totalSize) * 100)) 
                : 0;

            if (percent !== lastPercent) {
                lastPercent = percent;            
                this.publish({
                    socketId,
                    fileName,
                    uploaded: uploadedBytes,
                    total: totalSize,
                    percent,
                    status: 'uploading'
                });            
            }
        });

        passThrough.on('error', (error: Error) => {
            passThrough.destroy(error);
        });

        source.pipe(passThrough);

        return passThrough;
    }

    private publish(input: UploadProgressPayload): void {
        this.eventBus.publish(new UploadProgressEvent(input));
    }

    private validateFile(fileName: string, size: number) {
        this.validateFileSize(size);
        this.validateFileType(fileName);
    }

    private validateFileSize(size: number): void {
        if (size > MAX_FILE_SIZE) {
            const error: FileException = {
                errorCode: FileErrorCodes.FILE_SIZE_EXCEEDED,
                errorMessage: `File size exceeds the maximum limit of ${MAX_FILE_SIZE} bytes.`
            };

            throw new Error(JSON.stringify(error, null, 2));
        }
        
    }

    private validateFileType(fileName: string): void {
        const ext = path.extname(fileName).toLowerCase();

        if (!ALLOWED_FILE_TYPES.hasOwnProperty(ext)) {
            const error: FileException = {
                errorCode: FileErrorCodes.INVALID_FILE_TYPE,
                errorMessage: `File type ${ext} is not allowed.`
            };
            
            throw new Error(JSON.stringify(error, null, 2));
        }
    }

    private generateSafeFileName(fileName: string): string {
        const ext = path.extname(fileName).toLowerCase();
        const baseName = path.basename(fileName, ext)
            .replace(/[^a-zA-Z0-9_\-]/g, '_')
            .slice(0, 60);

        return `${Date.now()}-${baseName}${ext}`;
    }
}


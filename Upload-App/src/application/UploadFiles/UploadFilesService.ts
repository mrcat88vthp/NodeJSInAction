//User
import type { IFileStorage } from '@/domain/repositories/IFileStorage.js';
import type { IEventBus } from '@/domain/events/IEventBus.js';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/shared/constants/file.js';
import { type FileException, FileErrorCodes } from '@/application/UploadFiles/DTOs/FileException.js';
import type { UploadFileInputDTO, UploadFileOutputDTO } from '@/application/UploadFiles/DTOs/FileTypes.js';
import { UploadProgressEvent, type UploadProgressPayload } from '@/domain/events/UploadProgressEvent.js';

//Node.js built-in modules
import path from 'path';
import { Readable, PassThrough } from 'stream';
import { randomUUID } from 'crypto';
import { fileTypeFromBuffer } from 'file-type';


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
        this.validateFileSize(totalSize);

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
            //4. validate nội dung thực trước khi track/lưu
            const validatedStream = await this.validateFileTypeByContent_ver_1(stream);

            // 5. Bọc stream với progress tracking
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

            // 6. Lưu file — UseCase không biết lưu đâu (local / S3 / GCS)
            const filePath = await this.fileStorage.saveFile({
                fileName: safeName,
                size: totalSize,
                uploadDate: new Date(),
                mimeType
            }, trackedStream);

            // 7. Thông báo hoàn tất
            this.publish({
                socketId,
                fileName: safeName,
                uploaded: totalSize,
                total: totalSize,
                percent: 100,
                status: 'completed'
            });

            //8. Trả về thông tin file đã lưu
            const result: UploadFileOutputDTO = {
                originalFileName: fileName, 
                saveFileName: safeName,
                fileSize: totalSize, 
                filePath: filePath
            };

            return result;
        }
        catch (error) {
            throw error;
        }
    }

    // ── Private helpers ──────────────────────────────────────────
    /*
        * Validdate file extension theo byte đầu    
    */    
    private async validateFileTypeByContent_ver_1(
        source: Readable
    ): Promise<PassThrough> {
        return new Promise((resolve, reject) => {
            const passThrough = new PassThrough();

            let fileTypeBuffer: Buffer[] = [];
            let fileTypeDetected = false;

            source.on('data', async (chunk: Buffer) => {
                if (!fileTypeDetected) {
                    fileTypeBuffer.push(chunk);
                    const bufferCombined: Buffer<ArrayBuffer> = Buffer.concat(fileTypeBuffer);

                    if (bufferCombined.length < 262 && !source.readableEnded) return; // Wait for more data

                    fileTypeDetected = true;
                    source.pause(); // Pause the source stream while we check the file type

                    const detectedExt = await fileTypeFromBuffer(bufferCombined);
                    if (!detectedExt || !ALLOWED_FILE_TYPES.hasOwnProperty(detectedExt.ext)) {  
                        source.destroy();
                        const error: FileException = {
                            errorCode: FileErrorCodes.INVALID_FILE_TYPE,
                            errorMessage: `File type ${detectedExt} is not allowed.`
                        };

                        reject(new Error(JSON.stringify(error, null, 2)));
                        return;
                    }

                    // Hợp lệ → đẩy phần đã buffer ra trước, rồi resume stream tiếp tục pipe bình thường
                    passThrough.write(bufferCombined);
                    source.pipe(passThrough, { end: true });
                    source.resume(); // Resume the source stream
                    resolve(passThrough);
                }
                else {
                    passThrough.write(chunk);
                }
            });

            source.on('error', (err) => {
                source.destroy(err);
                reject(err);
            });
        });
    }

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
        let lastPercent = 0;  

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
            let errorPercent = totalSize > 0 
                ? Math.min(99, Math.round((uploadedBytes / totalSize) * 100)) 
                : 0;

            this.publish({
                socketId,
                fileName: fileName,
                uploaded: uploadedBytes,
                total: totalSize,
                percent: errorPercent,
                status: 'failed'
            });

            passThrough.destroy(error);
        });

        source.on('error', (error: Error) => {
            let errorPercent = totalSize > 0 
                ? Math.min(99, Math.round((uploadedBytes / totalSize) * 100)) 
                : 0;

            this.publish({
                socketId,
                fileName: fileName,
                uploaded: uploadedBytes,
                total: totalSize,
                percent: errorPercent,
                status: 'failed'
            });

            passThrough.destroy(error);
        });

        source.pipe(passThrough);

        return passThrough;
    }

    private publish(input: UploadProgressPayload): void {
        this.eventBus.publish(new UploadProgressEvent(input));
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

    

    /*
        * Tạo tên file safe bằng cách sử dụng UUID + extension
    */       
    private generateSafeFileName(fileName: string): string {
        const ext = path.extname(fileName).toLowerCase();        

        return `${randomUUID()}${ext}`;
    }    
}


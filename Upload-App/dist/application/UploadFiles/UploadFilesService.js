import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES, MIN_BYTES_TO_DETECT_FILE_TYPE } from '../../shared/constants/file.js';
import { FileErrorCodes } from '../../application/UploadFiles/DTOs/FileException.js';
import { UploadProgressEvent } from '../../domain/events/UploadProgressEvent.js';
//Node.js built-in modules
import path from 'path';
import { Readable, PassThrough } from 'stream';
import { randomUUID } from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
export class UploadFilesService {
    fileStorage;
    eventBus;
    constructor(fileStorage, eventBus) {
        this.fileStorage = fileStorage;
        this.eventBus = eventBus;
    }
    async UploadFile(input) {
        const { stream, fileName, mimeType, totalSize, socketId } = input;
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
            const validatedStream = await this.validateFileTypeByContent_ver_2(stream);
            // 5. Bọc stream với progress tracking
            //    PassThrough đứng giữa: source → PassThrough → writeStream
            //    Mỗi chunk qua PassThrough → publish event
            const trackedStream = this.createTrackedStream(stream, {
                socketId,
                fileName: safeName,
                totalSize
            });
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
            const result = {
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
    async validateFileTypeByContent_ver_1(source) {
        return new Promise((resolve, reject) => {
            const passThrough = new PassThrough();
            let fileTypeBuffer = [];
            let fileTypeDetected = false;
            source.on('data', async (chunk) => {
                if (!fileTypeDetected) {
                    fileTypeBuffer.push(chunk);
                    const bufferCombined = Buffer.concat(fileTypeBuffer);
                    if (bufferCombined.length < MIN_BYTES_TO_DETECT_FILE_TYPE && !source.readableEnded)
                        return; // Wait for more data
                    fileTypeDetected = true;
                    source.pause(); // Pause the source stream while we check the file type
                    const detectedExt = await fileTypeFromBuffer(bufferCombined);
                    if (!detectedExt || !ALLOWED_FILE_TYPES.hasOwnProperty(detectedExt.ext)) {
                        source.destroy();
                        const error = {
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
    async validateFileTypeByContent_ver_2(source) {
        const output = new PassThrough();
        return new Promise((resolve, reject) => {
            let state = 'collecting';
            let fileTypeBuffer = [];
            let filePendingBuffer = [];
            let fileTypeDetected = false;
            let fileStreamEnded = false; // ← MỚI: đánh dấu 'end' đã bắn ra, dù đang ở state nào
            const setPromiseState = (err) => {
                if (fileTypeDetected)
                    return;
                fileTypeDetected = true;
                err ? reject(err) : resolve(output);
            };
            const fail = (error) => {
                output.destroy(error);
                if (!source.destroyed)
                    source.destroy(error);
                setPromiseState(error);
            };
            const validateFileType = async (combined) => {
                state = 'validating';
                // Chỉ pause nếu stream chưa tự kết thúc — pause một stream đã 'end' là vô nghĩa
                if (!fileStreamEnded)
                    source.pause();
                let detectedExt;
                try {
                    detectedExt = await fileTypeFromBuffer(combined);
                }
                catch (error) {
                    return;
                }
                if (!detectedExt || ALLOWED_FILE_TYPES.hasOwnProperty(detectedExt.ext) === false) {
                    const error = {
                        errorCode: FileErrorCodes.INVALID_FILE_TYPE,
                        errorMessage: `File type ${detectedExt} is not allowed.`
                    };
                    fail(new Error(JSON.stringify(error, null, 2)));
                    return;
                }
                output.write(combined);
                for (const chunk of filePendingBuffer) {
                    output.write(chunk);
                }
                filePendingBuffer = [];
                state = 'endValidating';
                // Quyết định resume hay end DỰA TRÊN TRẠNG THÁI THỰC TẾ TẠI THỜI ĐIỂM NÀY,
                // không phải dựa trên tham số cố định lúc gọi validate() ban đầu.
                if (fileStreamEnded)
                    output.end();
                else
                    source.resume();
                setPromiseState();
            };
            const handleData = (chunk) => {
                if (state === 'collecting') {
                    fileTypeBuffer.push(chunk);
                    const bufferCombined = Buffer.concat(fileTypeBuffer);
                    if (bufferCombined.length >= MIN_BYTES_TO_DETECT_FILE_TYPE) {
                        validateFileType(bufferCombined);
                    }
                    return;
                }
                if (state === 'validating') {
                    filePendingBuffer.push(chunk);
                    return;
                }
                output.write(chunk);
            };
            const handleEnd = () => {
                fileStreamEnded = true; // luôn đánh dấu, bất kể state hiện tại là gì
                if (state === 'collecting') {
                    // File nhỏ hơn MIN_BYTES_FOR_DETECTION, hoặc kết thúc đúng lúc gần đủ ngưỡng
                    const bufferCombined = Buffer.concat(fileTypeBuffer);
                    validateFileType(bufferCombined);
                    return;
                }
                if (state === 'endValidating') {
                    output.end();
                    return;
                }
                // state === 'validating': không làm gì ở đây cả.
                // validate() đang await, khi xong nó sẽ tự đọc streamEnded=true
                // và gọi output.end() đúng thay vì resume(). Đây chính là fix của edge case.
            };
            const handleError = (error) => fail(error);
            source.on('data', handleData);
            source.on('end', handleEnd);
            source.on('error', handleError);
        });
    }
    /*
        * Tạo PassThrough stream để đo bytes đang chảy qua.
        * source → [PassThrough] → fileStorage.save()
        *                ↓ mỗi chunk
        *          publish event (không block stream)
    */
    createTrackedStream(source, options) {
        const { socketId, fileName, totalSize } = options;
        let uploadedBytes = 0;
        let lastPercent = 0;
        const passThrough = new PassThrough();
        passThrough.on('data', (chunk) => {
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
        passThrough.on('error', (error) => {
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
        source.on('error', (error) => {
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
    publish(input) {
        this.eventBus.publish(new UploadProgressEvent(input));
    }
    validateFileSize(size) {
        if (size > MAX_FILE_SIZE) {
            const error = {
                errorCode: FileErrorCodes.FILE_SIZE_EXCEEDED,
                errorMessage: `File size exceeds the maximum limit of ${MAX_FILE_SIZE} bytes.`
            };
            throw new Error(JSON.stringify(error, null, 2));
        }
    }
    /*
        * Tạo tên file safe bằng cách sử dụng UUID + extension
    */
    generateSafeFileName(fileName) {
        const ext = path.extname(fileName).toLowerCase();
        return `${randomUUID()}${ext}`;
    }
}
//# sourceMappingURL=UploadFilesService.js.map
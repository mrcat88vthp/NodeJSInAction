import { Router } from "express";

import { UploadFilesService } from "@/application/UploadFiles/UploadFilesService.js";
import type { UploadFileOutputDTO } from "@/application/UploadFiles/DTOs/FileTypes.js";
import type { IMultiPartParser } from "@/application/interfaces/ports/IMultiPartParser.js";
import type { ExceptionDTO } from "@/shared/types/exception.js";

export function createUploadRoute(
    uploadFilesService: UploadFilesService,
    multiPartParser: IMultiPartParser
): Router {
    const router = Router();

    router.post("/upload", async (req, res) => {
        try {
            if (!req.headers['content-type']?.includes('multipart/form-data')) {
                res.status(400).json({
                    message: 'Invalid content type. Expected multipart/form-data.',
                    statusCode: 'INVALID_CONTENT_TYPE'
                } as ExceptionDTO);
                return;
            }
            
            let socketId: string = '';
            let totalSize: number = 0;

            const uploadedFiles: Promise<UploadFileOutputDTO>[] = [];

            await multiPartParser.parse(req, {
                onField: (field) => {
                    if (field.name === 'socketId') {
                        socketId = field.value;
                    }

                    if (field.name === 'totalSize') {
                        totalSize = parseInt(field.value, 10) || 0;
                    }
                },
                onFile: (file) => {
                    if (!socketId) {
                        file.stream.resume(); // drain — không có nơi báo progress
                        console.warn(`'[UploadRoute] No socketId — skipping file ${file.fileName}`);
                        return;
                    }

                    uploadedFiles.push(
                        uploadFilesService.UploadFile({
                            stream: file.stream,
                            fileName: file.fileName,
                            mimeType: file.mimeType,
                            totalSize,
                            socketId
                        })
                    );
                },
                onFinish: (callback) => {},
                onError: (callback) => {},
            });

            const results = await Promise.all(uploadedFiles);
            res.status(200).json({
                results
            });
            
        }
        catch (error: Error | any) {
            res.status(500).json({ 
                message: error.message,
                statusCode: 'UPLOAD_ERROR'
            } as ExceptionDTO);
        }
    });

    return router;
}
import { Router } from "express";
import { UploadFilesService } from "../../../application/UploadFiles/UploadFilesService.js";
export function createUploadRoute(uploadFilesService, multiPartParser) {
    const router = Router();
    router.post("/upload", async (req, res) => {
        try {
            if (!req.headers['content-type']?.includes('multipart/form-data')) {
                res.status(400).json({
                    message: 'Invalid content type. Expected multipart/form-data.',
                    statusCode: 'INVALID_CONTENT_TYPE'
                });
                return;
            }
            let socketId = '';
            let totalSize = 0;
            const uploadedFiles = [];
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
                    uploadedFiles.push(uploadFilesService.UploadFile({
                        stream: file.stream,
                        fileName: file.fileName,
                        mimeType: file.mimeType,
                        totalSize,
                        socketId
                    }));
                }
            });
            const results = await Promise.all(uploadedFiles);
            res.status(200).json({
                statusCode: 'UPLOAD_SUCCESS',
                message: JSON.stringify(results, null, 2)
            });
        }
        catch (error) {
            res.status(500).json({
                message: error.message,
                statusCode: 'UPLOAD_ERROR'
            });
        }
    });
    return router;
}
//# sourceMappingURL=uploadRoute.js.map
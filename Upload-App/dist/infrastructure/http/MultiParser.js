import busboy from 'busboy';
import { IncomingMessage } from 'http';
import { MAX_COUNT_FILES, MAX_FILE_SIZE, MAX_COUNT_FIELDS } from '../../shared/constants/file.js';
export class MultiParser {
    constructor() { }
    async parse(req, handlers) {
        return new Promise((resolve, reject) => {
            const bb = busboy({
                headers: req.headers,
                limits: {
                    files: MAX_COUNT_FILES,
                    fileSize: MAX_FILE_SIZE,
                    fields: MAX_COUNT_FIELDS
                }
            });
            // ── xử lý text field ────────────────────────────────────────────────────
            bb.on('field', (name, value) => {
                handlers.onField({ name, value });
            });
            // ── xử lý file upload ───────────────────────────────────────────────────
            bb.on('file', (fieldName, file, info) => {
                handlers.onFile({
                    stream: file,
                    fileName: info.filename,
                    fieldName: fieldName,
                    mimeType: info.mimeType
                });
            });
            bb.on('finish', () => {
                resolve();
            });
            bb.on('error', (err) => {
                reject(err);
            });
            req.pipe(bb);
        });
    }
}
//# sourceMappingURL=MultiParser.js.map
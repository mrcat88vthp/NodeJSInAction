import busboy from 'busboy';
import { IncomingMessage  } from 'http';

import { MAX_COUNT_FILES, MAX_FILE_SIZE, MAX_COUNT_FIELDS } from '@/shared/constants/file.js';
import type { IMultiPartParser } from '@/application/interfaces/ports/IMultiPartParser.js';
import type { MultiPartParserFieldDTO, MultiPartParserHandlersDTO, MultiPartParserFileDTO } from '@/application/interfaces/ports/DTOs/MultiParserType.js';

export class MultiParser implements IMultiPartParser {
    constructor() { }

    async parse (
        req: IncomingMessage,
        handlers: MultiPartParserHandlersDTO
    ): Promise<void> {

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
                handlers.onField({name, value} as MultiPartParserFieldDTO);
            });

            // ── xử lý file upload ───────────────────────────────────────────────────
            bb.on('file', (fieldName, file, info) => {
                handlers.onFile({
                    stream: file,
                    fileName: info.filename,
                    fieldName: fieldName,
                    mimeType: info.mimeType            
                } as MultiPartParserFileDTO);
            });

            bb.on('finish', () => {    
                handlers.onFinish(() => {
                    resolve();
                });
            });

            bb.on('error', (err: Error) => {                
                handlers.onError((err: Error) => {
                    reject(err);
                });
            });

            req.pipe(bb);
        });
    }

    
}
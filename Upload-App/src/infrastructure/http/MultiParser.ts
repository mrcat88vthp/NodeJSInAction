import busboy from 'busboy';
import fs from 'fs';
import { IncomingMessage  } from 'http';

import { Paths } from '@/shared/constants/paths.js';
import { MAX_COUNT_FILES, MAX_FILE_SIZE, MAX_COUNT_FIELDS } from '@/shared/constants/file.js';
import type { IMultiPartParser } from '@/application/ports/IMultiPartParser.js';
import type { MultiPartParserFieldDTO, MultiPartParserFileDTO } from './DTOs/MultiParserType.js';

export class MultiParser implements IMultiPartParser {
    constructor() { }

    async parse (
        req: IncomingMessage
    ): Promise<void> {
        const fields: MultiPartParserFieldDTO = {};
        const files: MultiPartParserFileDTO[] = [];

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
                fields[name] = value;
                console.log(`[field] ${name}: ${value}`);
            });

            // ── xử lý file upload ───────────────────────────────────────────────────
            bb.on('file', (fieldName, file, info) => {
                const { filename, mimeType } = info;
                
                console.log(`[file] nhận: ${filename} (${mimeType})`);
            });

            bb.on('finish', () => {             
            });

            bb.on('error', (err) => {
                reject(err);
            });
        });
    }

    
}
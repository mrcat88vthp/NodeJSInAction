import busboy from 'busboy';
import fs from 'fs';

import { Paths } from '@/shared/constants/paths.js';
import type { IMultiPartParser } from '@/application/ports/IMultiPartParser.js';
import type { MultiPartParserInputDTO } from '@/application/ports/DTOs/MultiPartParserDTO.js';

export class MultiParser implements IMultiPartParser {
    constructor() {
        
    }

    async parse (
        req: NodeJS.ReadableStream,
        headers: Record<string, string>,
        onFile: (input: MultiPartParserInputDTO) => Promise<void>
    ): Promise<void> {

    }

    
}
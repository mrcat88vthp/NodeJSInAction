import { Readable } from 'stream';
import type { MultiPartParserHandlersDTO } from './DTOs/MultiParserType.js';

export interface IMultiPartParser {
    parse (
        req: Readable,
        handlers: MultiPartParserHandlersDTO
    ): Promise<void>;
}
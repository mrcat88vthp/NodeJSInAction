import type { MultiPartParserHandlerDTO } from "@/application/ports/DTOs/MultiPartParserHandlerDTO.js";
import { Readable } from 'stream';

export interface IMultiPartParser {
    parse (
        req: Readable,        
        handlers: MultiPartParserHandlerDTO
    ): Promise<void>;
}
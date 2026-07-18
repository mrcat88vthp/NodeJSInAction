import { IncomingMessage } from 'http';
import type { IMultiPartParser } from '../../application/interfaces/ports/IMultiPartParser.js';
import type { MultiPartParserHandlersDTO } from '../../application/interfaces/ports/DTOs/MultiParserType.js';
export declare class MultiParser implements IMultiPartParser {
    constructor();
    parse(req: IncomingMessage, handlers: MultiPartParserHandlersDTO): Promise<void>;
}
//# sourceMappingURL=MultiParser.d.ts.map
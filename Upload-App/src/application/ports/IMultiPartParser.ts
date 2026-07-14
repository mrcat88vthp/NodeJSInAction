import { Readable } from 'stream';

export interface IMultiPartParser {
    parse (
        req: Readable,        
    ): Promise<void>;
}
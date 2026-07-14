import { Readable } from 'stream';

export interface MultiPartParserFieldDTO {
    [key: string]: string;
}

export interface MultiPartParserFileDTO {
     stream: Readable,
     fileName: string,
     fieldName: string,
     mimeType: string,
}
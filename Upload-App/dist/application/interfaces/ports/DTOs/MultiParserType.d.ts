import { Readable } from 'stream';
export interface MultiPartParserFieldDTO {
    name: string;
    value: string;
}
export interface MultiPartParserFileDTO {
    stream: Readable;
    fileName: string;
    fieldName: string;
    mimeType: string;
}
export interface MultiPartParserHandlersDTO {
    onFile: (input: MultiPartParserFileDTO) => void;
    onField: (input: MultiPartParserFieldDTO) => void;
}
//# sourceMappingURL=MultiParserType.d.ts.map
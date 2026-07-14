import { Readable } from 'stream';

export interface MultiPartParserFileDTO {
     stream: Readable,
     fileName: string,
     fieldName: string,
     mimeType: string,
}

export interface MultiPartParserFieldDTO {
     name: string,
     value: string
}

export interface MultiPartParserHandlerDTO {
     onFile: (input: MultiPartParserFileDTO) => Promise<void>,
     onField: (input: MultiPartParserFieldDTO) => Promise<void>,
     onFinish: (resolve: () => void) => Promise<void>,
     onError: (reject: (reason?: any) => void) => Promise<void>
}

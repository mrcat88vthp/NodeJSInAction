export type MultiPartParserInputDTO = {
     stream: NodeJS.ReadableStream,
     fileName: string,
     totalSize: number
}
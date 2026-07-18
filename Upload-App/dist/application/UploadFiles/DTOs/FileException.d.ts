export declare const FileErrorCodes: {
    readonly FILE_SIZE_EXCEEDED: "FILE_001";
    readonly INVALID_FILE_TYPE: "FILE_002";
};
export type FileErrorCode = typeof FileErrorCodes[keyof typeof FileErrorCodes];
export interface FileException {
    errorCode: FileErrorCode;
    errorMessage: string;
}
//# sourceMappingURL=FileException.d.ts.map
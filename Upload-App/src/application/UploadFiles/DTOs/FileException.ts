export const FileErrorCodes = {
    FILE_SIZE_EXCEEDED: 'FILE_001',
    INVALID_FILE_TYPE: 'FILE_002',
    GET_FILE_TYPE_FAILED: 'FILE_003',
} as const;

export type FileErrorCode = typeof FileErrorCodes[keyof typeof FileErrorCodes];

export interface FileException {
    errorCode: FileErrorCode;
    errorMessage: string;
}
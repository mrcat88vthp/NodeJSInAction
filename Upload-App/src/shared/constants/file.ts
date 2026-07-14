export const MAX_FILE_SIZE:number = 10 * 1024 * 1024; // 10 MB

export const MAX_COUNT_FILES:number = 5; // 5 files

export const MAX_COUNT_FIELDS:number = 10; // 10 fields

export const MIN_BYTES_TO_DETECT_FILE_TYPE:number = 262; // Minimum bytes required to detect file type

export const ALLOWED_FILE_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css',
    '.js':   'application/javascript',
    '.json': 'application/json',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.mp4':  'video/mp4',
    '.pdf':  'application/pdf',
};
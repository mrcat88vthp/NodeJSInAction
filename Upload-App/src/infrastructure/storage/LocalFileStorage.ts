import fs from 'fs';
import path from 'path';

import type { IFileStorage } from '../../domain/repositories/IFileStorage.js';
import { Paths } from '../../shared/constants/paths.js';

export class LocalFileStorage implements IFileStorage {
    saveFile(
        fileName: string, 
        stream: NodeJS.ReadableStream
    ): Promise<string> {
        const filePath = path.join(Paths.rootPath);
        return new Promise((resolve, reject) => {
        });
    }
}
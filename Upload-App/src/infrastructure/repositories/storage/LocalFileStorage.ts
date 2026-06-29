import fs from 'fs';
import path from 'path';

import type { IFileStorage } from '@/domain/repositories/IFileStorage.js';
import { Paths } from '@/shared/constants/paths.js';

function unlinkFile(writeStream: fs.WriteStream, filePath: string, reject: (reason?: any) => void, err: Error) {
    writeStream.destroy();

    writeStream.once('close', () => {
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
                console.error(`Failed to delete file ${filePath}:`, unlinkErr);
            }        
        });    
    });

    reject(err);
}

export class LocalFileStorage implements IFileStorage {
    async saveFile(
        fileName: string, 
        stream: NodeJS.ReadableStream
    ): Promise<string> {
        const filePath = path.join(Paths.rootPath, fileName);       

        await new Promise<void>((resolve, reject) => {
            const writeStream: fs.WriteStream = fs.createWriteStream(filePath);

            stream.pipe(writeStream);

            writeStream.on('finish', resolve);

            writeStream.on('error', (err) => {
                unlinkFile(writeStream, filePath, reject, err);
            });

            stream.on('error', (err) => {
                unlinkFile(writeStream, filePath, reject, err);
            });

            stream.pipe(writeStream);
            
        });

        return filePath;
    }
}
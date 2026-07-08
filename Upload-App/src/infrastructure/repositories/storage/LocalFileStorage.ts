import fs from 'fs';
import path from 'path';

import type { IFileStorage } from '@/domain/repositories/IFileStorage.js';
import { Paths } from '@/shared/constants/paths.js';
import type { MetaDataFile } from '@/infrastructure/repositories/storage/DTOs/MetaDataFile.js';

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
    private writeQueue: Promise<void> = Promise.resolve();

    private constructor() {}    

    static async create(): Promise<LocalFileStorage> {
        // Tạo thư mục ngay khi khởi tạo
        await fs.promises.mkdir(Paths.uploadPath, { recursive: true });        
        console.log(`[LocalFileStorage] Upload dir: ${Paths.uploadPath}`);

        // Tạo file metadata ngay khi khởi tạo
        try {
            await fs.promises.access(Paths.metadataFilePath, fs.constants.F_OK);
        }
        catch {
            await fs.promises.writeFile(Paths.metadataFilePath, '[]', 'utf-8');
        }        

        console.log(`[LocalFileStorage] Metadata file: ${Paths.metadataFilePath}`);

        return new LocalFileStorage();
    }

    async saveFile(
        fileName: string, 
        stream: NodeJS.ReadableStream
    ): Promise<string> {
        const filePath = path.join(Paths.uploadPath, fileName);       

        await new Promise<void>((resolve, reject) => {
            const writeStream: fs.WriteStream = fs.createWriteStream(filePath);            

            writeStream.on('finish', async () => {
                await this.saveUpload([{ fileName, filePath }]);
                resolve();
            });

            let isUnlinked = false;
            const handlerError = (err: Error) => {
                if (isUnlinked) return;

                isUnlinked = true;                
                unlinkFile(writeStream, filePath, reject, err);
            }

            writeStream.on('error', handlerError);

            stream.on('error', (err) => {
                stream.unpipe(writeStream);
                if ('destroy' in stream) {
                    (stream as any).destroy();
                }
                handlerError(err);
            });

            stream.pipe(writeStream);
            
        });

        return filePath;
    }

    private async readMetadataFile(): Promise<MetaDataFile[]> {
        try {
            return JSON.parse(await fs.promises.readFile(Paths.metadataFilePath, 'utf-8'));
        }
        catch {
            return [];
        }
    }

    private async saveUpload(entries: MetaDataFile[]): Promise<void> {
        this.writeQueue = this.writeQueue.then(async () => {
            const metaFileUploaded = await this.readMetadataFile();
            metaFileUploaded.unshift(...entries);

            await fs.promises.writeFile(
                Paths.metadataFilePath, 
                JSON.stringify(metaFileUploaded, null, 2), 
                'utf-8'
            );
        });

        return this.writeQueue;
        
    }
}
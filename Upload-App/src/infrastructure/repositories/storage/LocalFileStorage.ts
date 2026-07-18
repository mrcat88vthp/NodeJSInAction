import fs from 'fs';
import path from 'path';

import type { IFileStorage } from '@/domain/repositories/IFileStorage.js';
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
    private static _uploadPath: string = '';
    private static _metadataFilePath: string = '';

    private constructor() {        
    }    

    static async create(uploadPath: string, metadataFilePath: string): Promise<LocalFileStorage> {
        // Tạo thư mục ngay khi khởi tạo
        this._uploadPath = uploadPath;
        this._metadataFilePath = metadataFilePath;

        await fs.promises.mkdir(uploadPath, { recursive: true });        
        console.log(`[LocalFileStorage] Upload dir: ${this._uploadPath}`);

        // Tạo file metadata ngay khi khởi tạo
        try {
            await fs.promises.access(this._metadataFilePath, fs.constants.F_OK);
        }
        catch {
            await fs.promises.writeFile(this._metadataFilePath, '[]', 'utf-8');
        }        

        console.log(`[LocalFileStorage] Metadata file: ${this._metadataFilePath}`);

        return new LocalFileStorage();
    }

    async saveFile(
        file: MetaDataFile, 
        stream: NodeJS.ReadableStream
    ): Promise<string> {
        const filePath = path.join(LocalFileStorage._uploadPath, file.fileName);       

        await new Promise<void>((resolve, reject) => {
            const writeStream: fs.WriteStream = fs.createWriteStream(filePath);
            
            let isUnlinked = false;
            const handlerError = (err: Error) => {
                if (isUnlinked) return;

                isUnlinked = true;                
                unlinkFile(writeStream, filePath, reject, err);
            }

            writeStream.on('finish', async () => {
                try {
                    await this.saveLogUpload([file]);
                    resolve();
                }
                catch (err) {
                    try {
                        await fs.promises.unlink(filePath);
                    }
                    catch (unlinkErr: any) {
                        if(unlinkErr.code === 'ENOENT') {
                            console.warn(`File ${filePath} already removed (not found), skip cleanup.`);
                        }
                        else {
                            console.error(`Failed to delete file ${filePath}:`, unlinkErr);                                                
                        }
                    }

                    reject(err);
                }
                
            });           

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

    private async readMetadataFile(metadataFilePath: string): Promise<MetaDataFile[]> {
        try {
            return JSON.parse(await fs.promises.readFile(metadataFilePath, 'utf-8'));
        }
        catch {
            return [];
        }
    }

    private saveLogUpload(entries: MetaDataFile[]): Promise<void> {
        const task = this.writeQueue.then(async () => {
            const metaFileUploaded: MetaDataFile[] = await this.readMetadataFile(LocalFileStorage._metadataFilePath);
            metaFileUploaded.unshift(...entries);

            await fs.promises.writeFile(
                LocalFileStorage._metadataFilePath, 
                JSON.stringify(metaFileUploaded, null, 2), 
                'utf-8'
            );
        });

        this.writeQueue = task.catch((err) => {
            console.error(`[LocalFileStorage] Failed to save metadata:`, err);
        });

        return task;
        
    }
}
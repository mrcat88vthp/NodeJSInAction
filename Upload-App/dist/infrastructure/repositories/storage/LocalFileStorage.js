import fs from 'fs';
import path from 'path';
function unlinkFile(writeStream, filePath, reject, err) {
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
export class LocalFileStorage {
    writeQueue = Promise.resolve();
    static _uploadPath = '';
    static _metadataFilePath = '';
    constructor() {
    }
    static async create(uploadPath, metadataFilePath) {
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
    async saveFile(file, stream) {
        const filePath = path.join(LocalFileStorage._uploadPath, file.fileName);
        await new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(filePath);
            let isUnlinked = false;
            const handlerError = (err) => {
                if (isUnlinked)
                    return;
                isUnlinked = true;
                unlinkFile(writeStream, filePath, reject, err);
            };
            writeStream.on('finish', async () => {
                try {
                    await this.saveLogUpload([file]);
                    resolve();
                }
                catch (err) {
                    try {
                        await fs.promises.unlink(filePath);
                    }
                    catch (unlinkErr) {
                        if (unlinkErr.code === 'ENOENT') {
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
                    stream.destroy();
                }
                handlerError(err);
            });
            stream.pipe(writeStream);
        });
        return filePath;
    }
    async readMetadataFile(metadataFilePath) {
        try {
            return JSON.parse(await fs.promises.readFile(metadataFilePath, 'utf-8'));
        }
        catch {
            return [];
        }
    }
    saveLogUpload(entries) {
        const task = this.writeQueue.then(async () => {
            const metaFileUploaded = await this.readMetadataFile(LocalFileStorage._metadataFilePath);
            metaFileUploaded.unshift(...entries);
            await fs.promises.writeFile(LocalFileStorage._metadataFilePath, JSON.stringify(metaFileUploaded, null, 2), 'utf-8');
        });
        this.writeQueue = task.catch((err) => {
            console.error(`[LocalFileStorage] Failed to save metadata:`, err);
        });
        return task;
    }
}
//# sourceMappingURL=LocalFileStorage.js.map
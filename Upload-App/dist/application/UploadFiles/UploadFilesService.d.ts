import type { IFileStorage } from '../../domain/repositories/IFileStorage.js';
import type { IEventBus } from '../../domain/events/IEventBus.js';
import type { UploadFileInputDTO, UploadFileOutputDTO } from '../../application/UploadFiles/DTOs/FileTypes.js';
export declare class UploadFilesService {
    private readonly fileStorage;
    private readonly eventBus;
    constructor(fileStorage: IFileStorage, eventBus: IEventBus);
    UploadFile(input: UploadFileInputDTO): Promise<UploadFileOutputDTO>;
    private validateFileTypeByContent_ver_1;
    private validateFileTypeByContent_ver_2;
    private createTrackedStream;
    private publish;
    private validateFileSize;
    private generateSafeFileName;
}
//# sourceMappingURL=UploadFilesService.d.ts.map
import { Router } from "express";
import { UploadFilesService } from "../../../application/UploadFiles/UploadFilesService.js";
import type { IMultiPartParser } from "../../../application/interfaces/ports/IMultiPartParser.js";
export declare function createUploadRoute(uploadFilesService: UploadFilesService, multiPartParser: IMultiPartParser): Router;
//# sourceMappingURL=uploadRoute.d.ts.map
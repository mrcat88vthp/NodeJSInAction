import  express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

//-----SHARED IMPORTS-----
import { PORT } from "@/shared/constants/port.js";
import { Paths } from "@/shared/constants/paths.js";

//-----INFRASTRUCTURE IMPORTS-----
import { LocalFileStorage } from "@/infrastructure/repositories/storage/LocalFileStorage.js";
import { InMemoryEventBus } from "@/infrastructure/events/InMemoryEventBus.js";
import { SocketIOGateway } from "@/infrastructure/websocket/SocketIOGateway.js";

//-----APPLICATION IMPORTS-----
import { UploadFilesService } from "@/application/UploadFiles/UploadFilesService.js";


const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: `http://localhost:${PORT}`,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    },
});

const fileStorage = await LocalFileStorage.create(Paths.uploadPath, Paths.metadataFilePath);
const eventBus = new InMemoryEventBus();
const socketIOGateway = new SocketIOGateway(io);

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
import { MultiParser } from "@/infrastructure/http/MultiParser.js";

//-----APPLICATION IMPORTS-----
import { UploadFilesService } from "@/application/UploadFiles/UploadFilesService.js";
import { UploadProgressHandler } from "@/application/UploadFiles/Handlers/UploadProgressHandler.js";

//-----PRESENTATION IMPORTS-----
import { createUploadRoute } from "@/presentation/routes/upload/uploadRoute.js";


// ── HTTP + Socket.IO server ──────────────────────────────────────
const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: `http://localhost:${PORT}`,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    },
});

// ════════════════════════════════════════════════════════════════
//  COMPOSITION ROOT
//  Đọc như một bản đồ phụ thuộc của toàn hệ thống
// ════════════════════════════════════════════════════════════════

// 1. Infrastructure layer
const fileStorage = await LocalFileStorage.create(Paths.uploadPath, Paths.metadataFilePath);
const eventBus = new InMemoryEventBus();
const socketIOGateway = new SocketIOGateway(io);
const multiParse = new MultiParser();

// 2. Wire event handlers vào bus
//    Thêm handler mới (audit, analytics...) → chỉ cần thêm ở đây
const uploadProgressHandler = new UploadProgressHandler(socketIOGateway);
eventBus.subscribe('upload.progress', uploadProgressHandler);

// 3. Application layer — inject interfaces, không inject classes
const uploadFileService = new UploadFilesService(fileStorage, eventBus);

//4. Presentation layer — inject services, không inject repositories
const uploadRoute = createUploadRoute(uploadFileService, multiParse);

// ── Express middleware ───────────────────────────────────────────
app.use(express.static(Paths.publicPath));
app.use('/api', uploadRoute);

// ── Socket.IO ────────────────────────────────────────────────────
io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
});

// ── Start server ─────────────────────────────────────────────────
httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
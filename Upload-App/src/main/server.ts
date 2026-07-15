import  express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import { LocalFileStorage } from "@/infrastructure/repositories/storage/LocalFileStorage.js";
import { InMemoryEventBus } from "@/infrastructure/events/InMemoryEventBus.js";
import { PORT } from "@/shared/constants/port.js";

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: `http://localhost:${PORT}`,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    },
});

const fileStorage = await LocalFileStorage.create();
const eventBus = new InMemoryEventBus();
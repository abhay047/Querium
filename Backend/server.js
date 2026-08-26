import "dotenv/config";
import app from "./src/app.js";
import http from "http"
import connectToDb from "./src/config/database.js";
import { initSocket } from "./src/sockets/server.socket.js";

const httpServer = http.createServer(app)

initSocket(httpServer);

connectToDb();

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});
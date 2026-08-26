import "dotenv/config";
import app from "./src/app.js";
import http from "http"
import connectToDb from "./src/config/database.js";
import { initSocket } from "./src/sockets/server.socket.js";

const httpServer = http.createServer(app)

initSocket(httpServer);

connectToDb();

httpServer.listen(3000, () => {
    console.log("Server is running on port 3000");
});

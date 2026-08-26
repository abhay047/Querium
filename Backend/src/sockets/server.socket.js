import {Server, Socket} from "socket.io"

let io;

export function initSocket(httpServer){
    io = new Server(httpServer, {
        cors:{
            origin: (origin, callback) => callback(null, true),
            credentials: true
        }
    })

    console.log("Socket.io server is running");

    io.on("connection", (Socket)=>{
        console.log("A user connected: " + Socket.id);
    })
}

export function getIO(){
    if(!io){
        throw new Error("Socket.io not initialized")
    }

    return io
}
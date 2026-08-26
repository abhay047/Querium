import {io} from "socket.io-client"

export const initilizeSocketConnection=()=>{
    const socket = io(import.meta.env.VITE_API_URL || "https://querium.onrender.com",{
        withCredentials:true
    })

    socket.on("connect",()=>{
        console.log("Connected to Socket.IO server");
    })
}
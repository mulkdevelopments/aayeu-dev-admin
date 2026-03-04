// import { Socket } from "socket.io-client";
import { useEffect } from "react";
import { io } from "socket.io-client";

const SocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL 
console.log("Socket URL:", SocketUrl);

const socket = io(SocketUrl, {
    transports: ["websocket"],
}); 

export default socket;



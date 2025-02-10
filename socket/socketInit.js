import http from "http"
import { Server } from "socket.io";
import { socketHandler } from "./socketHandler.js";
import connectDb from "../DB/config.js";
import express from "express"
import jwt from "jsonwebtoken"

// socket configuration ---
const socketApp = express();
const server = http.createServer(socketApp);
const io = new Server(server, { cors: { origin: "*" } });

connectDb();

io.use((socket, next) => {
  const token = socket.handshake.headers.authorization;
  console.log(socket.handshake)
  if (!token) {
    return next(new Error("Authentication error"));
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error"));
    socket.user = decoded;
    
    next();
  });
});

socketHandler(io);

server.listen(9000, () => {
  console.log(`Socket Server is running on port ${9000}`);
});
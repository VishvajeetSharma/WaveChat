import { io } from "socket.io-client";
import env from "../config/env.js";

let socket = null;

export function connectSocket(token) {
  if (socket) socket.disconnect();
  socket = io(env.apiUrl, { auth: { token }, autoConnect: true });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default { connectSocket, getSocket, disconnectSocket };

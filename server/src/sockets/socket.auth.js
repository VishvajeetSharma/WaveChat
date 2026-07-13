import { verifyAuthToken } from "../utils/jwt.js";

export function socketAuth(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Missing authentication token"));

    const payload = verifyAuthToken(token);
    socket.user = { id: payload.sub, username: payload.username };
    next();
  } catch (err) {
    next(new Error("Invalid or expired token"));
  }
}

export default socketAuth;

import { verifyAuthToken } from "../utils/jwt.js";
import { AppError } from "../errors/AppError.js";

export function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(AppError.unauthorized("Missing authentication token"));
  }

  try {
    const payload = verifyAuthToken(token);
    req.user = { id: payload.sub, username: payload.username };
    next();
  } catch (err) {
    next(AppError.unauthorized("Invalid or expired token"));
  }
}

export default authenticate;

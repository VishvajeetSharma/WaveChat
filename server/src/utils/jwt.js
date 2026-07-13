import jwt from "jsonwebtoken";
import config from "../config/env.js";

export function signAuthToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

export function verifyAuthToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

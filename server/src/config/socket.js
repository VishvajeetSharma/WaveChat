import config from "./env.js";

export const socketServerOptions = {
  cors: {
    origin: config.clientOrigins,
    credentials: true,
  },
};

export default socketServerOptions;

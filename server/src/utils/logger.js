/* eslint-disable no-console */
import config from "../config/env.js";

function timestamp() {
  return new Date().toISOString();
}

const logger = {
  info: (...args) => console.log(`[${timestamp()}] INFO`, ...args),
  warn: (...args) => console.warn(`[${timestamp()}] WARN`, ...args),
  error: (...args) => console.error(`[${timestamp()}] ERROR`, ...args),
  debug: (...args) => {
    if (!config.isProduction) console.debug(`[${timestamp()}] DEBUG`, ...args);
  },
};

export default logger;

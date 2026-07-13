// Tracks which socket ids belong to which user id, so a user who has the
// app open in multiple tabs/devices is only reported "offline" once every
// connection has closed.
//
// NOTE: this is in-memory and per-process. If you scale the server
// horizontally, replace this with a shared store (e.g. Redis) and use the
// socket.io-redis adapter so presence and broadcasts work across instances.
const onlineUsers = new Map(); // userId -> Set<socketId>

export function markOnline(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
}

/** Returns true if this was the user's last open connection (now fully offline). */
export function markOffline(userId, socketId) {
  const set = onlineUsers.get(userId);
  if (!set) return false;
  set.delete(socketId);
  if (set.size === 0) {
    onlineUsers.delete(userId);
    return true;
  }
  return false;
}

export function isOnline(userId) {
  return onlineUsers.has(userId);
}

export default { markOnline, markOffline, isOnline };

// Simple Socket.IO holder to allow controllers/services to emit events
// without circular dependencies. Call setIO(io) once during server init.

let ioInstance = null;

function setIO(io) {
  ioInstance = io;
}

function getIO() {
  return ioInstance;
}

module.exports = { setIO, getIO };

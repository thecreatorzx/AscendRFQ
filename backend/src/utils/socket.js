import { Server } from "socket.io";

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_rfq", (rfqId) => {
      socket.join(rfqId);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};

export { initSocket, getIO };

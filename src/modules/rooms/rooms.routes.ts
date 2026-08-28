import { roomsController } from "./rooms.controller.ts";
import { roomsService, roomHub } from "./rooms.service.ts";
import { roomIdParamSchema, wsIncomingSchema } from "./rooms.schema.ts";
import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate.ts";
import { ProblemDocument } from "../../models/error.model.ts";
import type { WebSocket } from "@fastify/websocket";

type RoomParams = { Params: { roomId: string } };

export async function roomsRoutes(app: FastifyInstance) {
  app.post("/rooms", { preHandler: authenticate }, roomsController.createRoom);
  app.get("/rooms", roomsController.listRooms);
  app.get<RoomParams>("/rooms/:roomId", roomsController.getRoom);
  app.patch<RoomParams>("/rooms/:roomId", { preHandler: authenticate }, roomsController.updateRoom);
  app.delete<RoomParams>("/rooms/:roomId", { preHandler: authenticate }, roomsController.closeRoom);

  app.post<RoomParams>(
    "/rooms/:roomId/participants",
    { preHandler: authenticate },
    roomsController.joinRoom,
  );
  app.delete<RoomParams>(
    "/rooms/:roomId/participants",
    { preHandler: authenticate },
    roomsController.leaveRoom,
  );

  app.post<RoomParams>(
    "/rooms/:roomId/messages",
    { preHandler: authenticate },
    roomsController.sendMessage,
  );
  app.post<RoomParams>(
    "/rooms/:roomId/queue",
    { preHandler: authenticate },
    roomsController.queueTrack,
  );
  app.post<RoomParams>(
    "/rooms/:roomId/queue/votes",
    { preHandler: authenticate },
    roomsController.voteTrack,
  );

  app.get<{ Params: { roomId: string }; Querystring: { token?: string } }>(
    "/rooms/:roomId/ws",
    { websocket: true, preHandler: authenticate },
    async (socket: WebSocket, req) => {
      const { roomId } = roomIdParamSchema.parse(req.params);
      const userId = req.user.sub;

      await roomsService.assertParticipant(roomId, userId).catch((err) => {
        socket.close(4403, err instanceof ProblemDocument ? err.detail : "Forbidden");
        throw err;
      });

      roomHub.add(roomId, socket);

      socket.on("message", async (raw: Buffer) => {
        let parsed;
        try {
          parsed = wsIncomingSchema.parse(JSON.parse(raw.toString()));
        } catch {
          socket.send(
            JSON.stringify({ type: "error", payload: { message: "Invalid message format" } }),
          );
          return;
        }

        try {
          switch (parsed.type) {
            case "chat:send":
              await roomsService.sendMessage(roomId, userId, parsed.payload.body);
              break;
            case "queue:add":
              await roomsService.addTrackToQueue(roomId, userId, parsed.payload);
              break;
            case "queue:vote":
              await roomsService.voteOnTrack(roomId, userId, parsed.payload);
              break;
            case "playback:sync_request": {
              const state = await roomsService.getRoomState(roomId);
              socket.send(JSON.stringify({ type: "playback:sync", payload: state.queue }));
              break;
            }
          }
        } catch (err) {
          const message = err instanceof ProblemDocument ? err.detail : "Unexpected error";
          socket.send(JSON.stringify({ type: "error", payload: { message } }));
        }
      });

      socket.on("close", () => {
        roomHub.remove(roomId, socket);
      });
    },
  );
}

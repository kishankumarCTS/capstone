import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TaskGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('joinTaskAssigned')
  async handleJoinRoom(
    @MessageBody() taskId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `task-${taskId}`;
    await client.join(room);
    return { success: true, room };
  }

  @SubscribeMessage('assigned')
  handleMessageToRoom(@MessageBody() data: { taskId: string; userId: string }) {
    const room = `task-${data.taskId}`;
    this.server.to(room).emit('assigned', {
      user: data.userId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('leaveTaskAssigned')
  async handleLeaveRoom(
    @MessageBody() taskId: string,
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(`task-${taskId}`);
  }

  handleConnection() {}
  handleDisconnect() {}
}

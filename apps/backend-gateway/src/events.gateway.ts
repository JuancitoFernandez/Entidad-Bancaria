import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { EventEnvelope } from '@banking-events-system/event-contracts';

interface ClientSubscription {
  socketId: string;
  transactionIds: Set<string>;
  userIds: Set<string>;
}

@WebSocketGateway({
  cors: {
    origin: '*', // En producción, especificar dominios permitidos
    credentials: true,
  },
  namespace: '/',
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private readonly clients = new Map<string, ClientSubscription>();

  /**
   * Maneja nuevas conexiones de clientes WebSocket
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Inicializar suscripciones del cliente
    this.clients.set(client.id, {
      socketId: client.id,
      transactionIds: new Set(),
      userIds: new Set(),
    });

    // Enviar confirmación de conexión
    client.emit('connected', {
      message: 'Connected to WebSocket gateway',
      socketId: client.id,
    });
  }

  /**
   * Maneja desconexiones de clientes WebSocket
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clients.delete(client.id);
  }

  /**
   * Maneja la suscripción a eventos por transactionId o userId
   */
  @SubscribeMessage('subscribeToTx')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { transactionId?: string; userId?: string },
  ) {
    const subscription = this.clients.get(client.id);
    
    if (!subscription) {
      client.emit('error', { message: 'Client not found' });
      return;
    }

    if (data.transactionId) {
      subscription.transactionIds.add(data.transactionId);
      this.logger.log(
        `Client ${client.id} subscribed to transactionId: ${data.transactionId}`,
      );
      client.emit('subscribed', {
        type: 'transactionId',
        value: data.transactionId,
        message: `Subscribed to transaction: ${data.transactionId}`,
      });
    }

    if (data.userId) {
      subscription.userIds.add(data.userId);
      this.logger.log(
        `Client ${client.id} subscribed to userId: ${data.userId}`,
      );
      client.emit('subscribed', {
        type: 'userId',
        value: data.userId,
        message: `Subscribed to user: ${data.userId}`,
      });
    }

    if (!data.transactionId && !data.userId) {
      client.emit('error', {
        message: 'Please provide transactionId or userId',
      });
    }
  }

  /**
   * Maneja la cancelación de suscripciones
   */
  @SubscribeMessage('unsubscribeFromTx')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { transactionId?: string; userId?: string },
  ) {
    const subscription = this.clients.get(client.id);
    
    if (!subscription) {
      client.emit('error', { message: 'Client not found' });
      return;
    }

    if (data.transactionId) {
      subscription.transactionIds.delete(data.transactionId);
      this.logger.log(
        `Client ${client.id} unsubscribed from transactionId: ${data.transactionId}`,
      );
      client.emit('unsubscribed', {
        type: 'transactionId',
        value: data.transactionId,
      });
    }

    if (data.userId) {
      subscription.userIds.delete(data.userId);
      this.logger.log(
        `Client ${client.id} unsubscribed from userId: ${data.userId}`,
      );
      client.emit('unsubscribed', {
        type: 'userId',
        value: data.userId,
      });
    }
  }

  /**
   * Retransmite un evento de Kafka a los clientes suscritos
   * Este método es llamado por el KafkaConsumerService
   */
  broadcastEvent(event: EventEnvelope): void {
    const { transactionId, userId } = event;
    let sentCount = 0;

    // Iterar sobre todos los clientes conectados
    for (const [socketId, subscription] of this.clients.entries()) {
      const socket = this.server.sockets.sockets.get(socketId);
      
      if (!socket) {
        // Cliente desconectado, limpiar
        this.clients.delete(socketId);
        continue;
      }

      // Verificar si el cliente está suscrito a este transactionId o userId
      const isSubscribedToTransaction =
        subscription.transactionIds.has(transactionId);
      const isSubscribedToUser = subscription.userIds.has(userId);

      if (isSubscribedToTransaction || isSubscribedToUser) {
        // Enviar el evento al cliente
        socket.emit('transactionEvent', event);
        sentCount++;
        
        this.logger.debug(
          `Event ${event.type} sent to client ${socketId} (transactionId: ${transactionId}, userId: ${userId})`,
        );
      }
    }

    if (sentCount > 0) {
      this.logger.log(
        `Event ${event.type} (transactionId: ${transactionId}) broadcasted to ${sentCount} client(s)`,
      );
    } else {
      this.logger.debug(
        `Event ${event.type} (transactionId: ${transactionId}) - no subscribers`,
      );
    }
  }

  /**
   * Obtiene estadísticas de conexiones y suscripciones
   */
  @SubscribeMessage('getStats')
  handleGetStats(@ConnectedSocket() client: Socket) {
    const stats = {
      totalClients: this.clients.size,
      totalSubscriptions: Array.from(this.clients.values()).reduce(
        (acc, sub) =>
          acc + sub.transactionIds.size + sub.userIds.size,
        0,
      ),
    };
    
    client.emit('stats', stats);
    return stats;
  }
}




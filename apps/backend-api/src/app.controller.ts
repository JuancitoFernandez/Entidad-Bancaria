import { Body, Controller, Post } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  EventEnvelope,
  TransactionInitiated,
} from '@banking-events-system/event-contracts';
import { KafkaService } from './kafka.service';

@Controller()
export class AppController {
  constructor(private readonly kafkaService: KafkaService) {}

  @Post('transactions')
  async createTransaction(@Body() body: TransactionInitiated) {
    // Generar transactionId (uuid)
    const transactionId = uuidv4();

    // Construir el payload de TransactionInitiated (asegurar currency por defecto)
    const payload: TransactionInitiated = {
      fromAccount: body.fromAccount,
      toAccount: body.toAccount,
      amount: body.amount,
      currency: body.currency || 'USD',
      userId: body.userId,
    };

    // Construir el evento EventEnvelope<TransactionInitiated>
    const event: EventEnvelope<TransactionInitiated> = {
      id: uuidv4(), // id del evento (uuid)
      type: 'txn.TransactionInitiated',
      version: 1,
      ts: Date.now(), // epoch ms
      transactionId, // partition key
      userId: payload.userId,
      payload,
    };

    // Publicar el evento en el tópico txn.commands usando transactionId como key
    await this.kafkaService.publishEvent('txn.commands', transactionId, event);

    return {
      success: true,
      transactionId,
      message: 'Transaction initiated successfully',
      event,
    };
  }
}


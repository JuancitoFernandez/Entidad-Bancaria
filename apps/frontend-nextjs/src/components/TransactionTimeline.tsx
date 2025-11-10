'use client';

import { useEffect, useRef } from 'react';
import { EventEnvelope } from '@banking-events-system/event-contracts';
import { io, Socket } from 'socket.io-client';

interface TransactionTimelineProps {
  transactionId: string | null;
  events: EventEnvelope[];
  onEventReceived: (event: EventEnvelope) => void;
  onConnectionStatus: (connected: boolean) => void;
}

export default function TransactionTimeline({
  transactionId,
  events,
  onEventReceived,
  onConnectionStatus,
}: TransactionTimelineProps) {
  const socketRef = useRef<Socket | null>(null);
  const subscribedRef = useRef<boolean>(false);
  const currentTransactionIdRef = useRef<string | null>(null);
  const onEventReceivedRef = useRef(onEventReceived);
  const onConnectionStatusRef = useRef(onConnectionStatus);

  // Mantener las referencias a las funciones callback actualizadas
  useEffect(() => {
    onEventReceivedRef.current = onEventReceived;
    onConnectionStatusRef.current = onConnectionStatus;
  }, [onEventReceived, onConnectionStatus]);

  useEffect(() => {
    // Si no hay transactionId, limpiar conexión existente y salir
    if (!transactionId) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        subscribedRef.current = false;
        currentTransactionIdRef.current = null;
        onConnectionStatusRef.current(false);
      }
      return;
    }

    // Si ya hay una conexión activa para este transactionId, no hacer nada
    if (
      socketRef.current?.connected &&
      currentTransactionIdRef.current === transactionId &&
      subscribedRef.current
    ) {
      return;
    }

    // Si hay una conexión pero para un transactionId diferente, limpiarla primero
    if (socketRef.current && currentTransactionIdRef.current !== transactionId) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      subscribedRef.current = false;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3003';
    
    // Conectar al WebSocket solo si no existe una conexión
    if (!socketRef.current) {
      const socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socketRef.current = socket;
      currentTransactionIdRef.current = transactionId;

      // Manejar conexión
      socket.on('connect', () => {
        console.log('Connected to WebSocket');
        onConnectionStatusRef.current(true);

        // Suscribirse al transactionId cuando se conecte
        // Usar el valor actual de la ref para evitar problemas de closure
        const txIdToSubscribe = currentTransactionIdRef.current;
        if (txIdToSubscribe && socketRef.current) {
          socketRef.current.emit('subscribeToTx', { transactionId: txIdToSubscribe });
          subscribedRef.current = true;
          console.log(`Subscribed to transactionId: ${txIdToSubscribe}`);
        }
      });

      // Manejar desconexión
      socket.on('disconnect', (reason) => {
        console.log('Disconnected from WebSocket:', reason);
        // Solo actualizar estado si fue una desconexión intencional
        // No actualizar si es una reconexión automática
        if (reason === 'io client disconnect') {
          onConnectionStatusRef.current(false);
          subscribedRef.current = false;
        }
      });

      // Manejar reconexión
      socket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected to WebSocket after', attemptNumber, 'attempts');
        onConnectionStatusRef.current(true);
        // Re-suscribirse después de reconectar
        const txIdToSubscribe = currentTransactionIdRef.current;
        if (txIdToSubscribe && socketRef.current) {
          socketRef.current.emit('subscribeToTx', { transactionId: txIdToSubscribe });
          subscribedRef.current = true;
          console.log(`Re-subscribed to transactionId: ${txIdToSubscribe}`);
        }
      });

      // Manejar confirmación de suscripción
      socket.on('subscribed', (data) => {
        console.log('Subscribed:', data);
      });

      // Manejar eventos de transacción
      socket.on('transactionEvent', (event: EventEnvelope) => {
        console.log('Event received:', event);
        onEventReceivedRef.current(event);
      });

      // Manejar errores
      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        onConnectionStatusRef.current(false);
      });
    } else if (socketRef.current.connected && currentTransactionIdRef.current === transactionId && !subscribedRef.current) {
      // Si la conexión ya existe pero no estamos suscritos, suscribirnos
      socketRef.current.emit('subscribeToTx', { transactionId });
      subscribedRef.current = true;
      console.log(`Subscribed to transactionId: ${transactionId}`);
    }

    // Cleanup: React ejecutará esto cuando transactionId cambie o el componente se desmonte
    return () => {
      // Verificar si el transactionId actual en la ref coincide con el que está en el closure
      // Si no coincide, significa que cambió y debemos limpiar
      if (socketRef.current && currentTransactionIdRef.current === transactionId) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        subscribedRef.current = false;
        currentTransactionIdRef.current = null;
        onConnectionStatusRef.current(false);
      }
    };
  }, [transactionId]); // Solo dependemos de transactionId

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  const getEventDisplayName = (type: string) => {
    const eventNames: Record<string, string> = {
      'txn.FundsReserved': 'Funds Reserved',
      'txn.FraudChecked': 'Fraud Checked',
      'txn.Committed': 'Committed',
      'txn.Reversed': 'Reversed',
      'txn.Notified': 'Notified',
    };
    return eventNames[type] || type;
  };

  const getEventClassName = (type: string) => {
    const classNames: Record<string, string> = {
      'txn.FundsReserved': 'event-funds-reserved',
      'txn.FraudChecked': 'event-fraud-checked',
      'txn.Committed': 'event-committed',
      'txn.Reversed': 'event-reversed',
      'txn.Notified': 'event-notified',
    };
    return classNames[type] || '';
  };

  const renderEventPayload = (event: EventEnvelope) => {
    const { payload, type } = event;

    if (type === 'txn.FraudChecked') {
      const risk = (payload as any).risk;
      return (
        <div>
          Risk Level:{' '}
          <span className={`status-badge ${risk.toLowerCase()}`}>
            {risk}
          </span>
        </div>
      );
    }

    if (type === 'txn.FundsReserved') {
      const fundsReserved = payload as any;
      return (
        <div>
          Hold ID: {fundsReserved.holdId}
          <br />
          Amount: {fundsReserved.amount}
        </div>
      );
    }

    if (type === 'txn.Committed') {
      const committed = payload as any;
      return <div>Ledger TX ID: {committed.ledgerTxId}</div>;
    }

    if (type === 'txn.Reversed') {
      const reversed = payload as any;
      return <div>Reason: {reversed.reason}</div>;
    }

    if (type === 'txn.Notified') {
      const notified = payload as any;
      return <div>Channels: {notified.channels?.join(', ')}</div>;
    }

    return <div>{JSON.stringify(payload, null, 2)}</div>;
  };

  if (!transactionId) {
    return (
      <div className="timeline">
        <div className="timeline-empty">
          No transaction initiated yet. Create a transaction to see the timeline.
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="timeline">
        <div className="timeline-empty">
          No events yet... Waiting for events...
        </div>
      </div>
    );
  }

  return (
    <div className="timeline">
      {events.map((event, index) => (
        <div
          key={`${event.id}-${index}`}
          className={`timeline-item ${getEventClassName(event.type)}`}
        >
          <div className="timeline-item-header">
            <span className="timeline-item-type">
              {getEventDisplayName(event.type)}
            </span>
            <span className="timeline-item-time">
              {formatTimestamp(event.ts)}
            </span>
          </div>
          <div className="timeline-item-body">
            {renderEventPayload(event)}
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
              Transaction ID: {event.transactionId}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}



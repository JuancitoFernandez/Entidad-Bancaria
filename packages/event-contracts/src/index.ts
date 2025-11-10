// Tipos compartidos para eventos de transacciones bancarias

// Basado en la Sección 05: Contratos del evento

/**
Define el "sobre" estándar para todos los eventos
*/ 
export interface EventEnvelope<T = any> { 
  id: string; // uuid v4 
  type: string; // ej: "txn.FundsReserved" 
  version: number; // 1 
  ts: number; // epoch ms 
  transactionId: string; // partition key 
  userId: string; 
  payload: T; 
  correlationId?: string; 
}

// --- Definiciones de Payloads --- //

export type TransactionInitiated = { 
  fromAccount: string; 
  toAccount: string; 
  amount: number; 
  currency: string; 
  userId: string; 
};

export type FundsReserved = { 
  ok: true; 
  holdId: string; 
  amount: number; 
};

export type FraudChecked = { 
  risk: 'LOW' | 'HIGH'; 
};

export type Committed = { 
  ledgerTxId: string; 
};

export type Reversed = { 
  reason: string; 
};

export type Notified = { 
  channels: string[]; // ej: ['email', 'sms'] 
};

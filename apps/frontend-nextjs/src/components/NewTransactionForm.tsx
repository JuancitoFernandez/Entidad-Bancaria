'use client';

import { useState, FormEvent } from 'react';
import { TransactionInitiated } from '@banking-events-system/event-contracts';
import CurrencySelector from '@/components/CurrencySelector';

interface NewTransactionFormProps {
  onTransactionCreated: (transactionId: string) => void;
  onConnectionStatus: (connected: boolean) => void;
}

export default function NewTransactionForm({
  onTransactionCreated,
  onConnectionStatus,
}: NewTransactionFormProps) {
  const [formData, setFormData] = useState<TransactionInitiated & { description?: string }>({
    userId: '',
    fromAccount: '',
    toAccount: '',
    amount: 0,
    currency: 'USD',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      // Preparar el body (excluir description que no está en TransactionInitiated)
      const { description, ...transactionData } = formData;

      const response = await fetch(`${apiUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.statusText}`);
      }

      const data = await response.json();
      setSuccess(`Transaction created successfully! ID: ${data.transactionId}`);
      
      // Notificar al componente padre
      onTransactionCreated(data.transactionId);
      
      // Reset form
      setFormData({
        userId: '',
        fromAccount: '',
        toAccount: '',
        amount: 0,
        currency: 'USD',
        description: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      onConnectionStatus(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <div>
      <h2>Nueva Transacción</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="userId">ID de Usuario *</label>
          <input
            type="text"
            id="userId"
            name="userId"
            value={formData.userId}
            onChange={handleChange}
            required
            placeholder="user123"
          />
        </div>

        <div className="form-group">
          <label htmlFor="fromAccount">Cuenta Origen *</label>
          <input
            type="text"
            id="fromAccount"
            name="fromAccount"
            value={formData.fromAccount}
            onChange={handleChange}
            required
            placeholder="ACC001"
          />
        </div>

        <div className="form-group">
          <label htmlFor="toAccount">Cuenta Destino *</label>
          <input
            type="text"
            id="toAccount"
            name="toAccount"
            value={formData.toAccount}
            onChange={handleChange}
            required
            placeholder="ACC002"
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Monto *</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>

        <div className="form-group-currency">
          <label>Moneda *</label>
          <CurrencySelector
            selectedCurrency={formData.currency}
            onCurrencyChange={(currency) => {
              setFormData((prev) => ({
                ...prev,
                currency,
              }));
            }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Descripción (Opcional)</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Descripción de la transacción..."
          />
        </div>

        <button
          type="submit"
          className="btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Procesando...' : 'Enviar Dinero'}
        </button>
      </form>
    </div>
  );
}



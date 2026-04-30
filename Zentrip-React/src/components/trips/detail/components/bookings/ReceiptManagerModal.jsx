import { useState } from 'react';
import { X } from 'lucide-react';
import BookingReceiptUpload from './BookingReceiptUpload';
import { updateBooking } from '../../../../../services/tripService';
import { updateExpenseReceiptsByBooking } from '../../../../../services/budgetService';

export default function ReceiptManagerModal({ booking, tripId, onClose, onUpdated }) {
  const [receiptUrls, setReceiptUrls] = useState(booking.receiptUrls ?? []);

  const handleUpdate = async (urls) => {
    setReceiptUrls(urls);
    try {
      await updateBooking(tripId, booking.id, { receiptUrls: urls });
      onUpdated?.(urls);
      updateExpenseReceiptsByBooking(tripId, booking.id, urls).catch(() => {});
    } catch (err) {
      console.error('[ReceiptManagerModal] Error al guardar comprobante:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-neutral-7/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="body-2-semibold text-neutral-7">Comprobantes de reserva</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-neutral-2 flex items-center justify-center text-neutral-5 hover:bg-neutral-1 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <BookingReceiptUpload
          initialUrls={receiptUrls}
          onUpdate={handleUpdate}
          optional={true}
        />
        <button
          onClick={onClose}
          className="h-10 rounded-lg border border-neutral-2 body-3 text-neutral-5 hover:bg-neutral-1 transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { X, ExternalLink, Calendar, Users, BedDouble, UserCircle } from 'lucide-react';
import { updateBooking } from '../../../../../../services/tripService';
import BookingReceiptUpload from '../BookingReceiptUpload';
import { StarRow } from './HotelAtoms';
import { fmtDate } from './hotelUtils';

function initUrls(booking) {
  if (Array.isArray(booking.receiptUrls) && booking.receiptUrls.length > 0) return booking.receiptUrls;
  if (booking.receiptUrl) return [booking.receiptUrl];
  return [];
}

export default function BookingDetailModal({ booking, tripId, onClose, onUpdated }) {
  const [saved, setSaved] = useState(false);

  const handleUpdate = async (urls) => {
    setSaved(false);
    try {
      await updateBooking(tripId, booking.id, { receiptUrls: urls });
      setSaved(true);
      onUpdated?.({ ...booking, receiptUrls: urls });
    } catch {
      // error is shown by the upload component itself
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-neutral-7/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg max-h-[90vh] bg-white rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-1 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">🏨</span>
            <div className="min-w-0">
              <p className="body-2-semibold text-neutral-7 truncate">{booking.hotelName}</p>
              {booking.hotelStars > 0 && <StarRow stars={booking.hotelStars} />}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-neutral-2 flex items-center justify-center text-neutral-5 hover:bg-neutral-1 transition shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-5">

          {/* Detalles */}
          <div className="bg-neutral-1/60 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 body-3 text-neutral-6">
              <Calendar className="w-4 h-4 text-neutral-4 shrink-0" />
              <span>
                <span className="font-semibold">{fmtDate(booking.checkIn)}</span>
                {' → '}
                <span className="font-semibold">{fmtDate(booking.checkOut)}</span>
                {booking.nights > 0 && (
                  <span className="text-neutral-4"> · {booking.nights} noche{booking.nights !== 1 ? 's' : ''}</span>
                )}
              </span>
            </div>
            {booking.adults > 0 && (
              <div className="flex items-center gap-2 body-3 text-neutral-6">
                <Users className="w-4 h-4 text-neutral-4 shrink-0" />
                <span>{booking.adults} adulto{booking.adults !== 1 ? 's' : ''}</span>
              </div>
            )}
            {booking.rooms > 0 && (
              <div className="flex items-center gap-2 body-3 text-neutral-6">
                <BedDouble className="w-4 h-4 text-neutral-4 shrink-0" />
                <span>{booking.rooms} habitación{booking.rooms !== 1 ? 'es' : ''}</span>
              </div>
            )}
            {booking.createdBy && (
              <div className="flex items-center gap-2 body-3 text-neutral-6">
                {booking.createdBy.photoURL ? (
                  <img src={booking.createdBy.photoURL} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                ) : (
                  <UserCircle className="w-4 h-4 text-neutral-4 shrink-0" />
                )}
                <span>Reservado por <span className="font-semibold">{booking.createdBy.name}</span></span>
              </div>
            )}
            {booking.pricePerNight != null && (
              <div className="flex items-center justify-between pt-2 border-t border-neutral-2">
                <span className="body-3 text-neutral-4">Precio total</span>
                <div className="text-right">
                  <p className="body-2-semibold text-auxiliary-green-5">
                    {booking.totalPrice ?? booking.pricePerNight} {booking.currency}
                  </p>
                  <p className="body-3 text-neutral-4">{booking.pricePerNight} {booking.currency}/noche</p>
                </div>
              </div>
            )}
          </div>

          {/* Capturas */}
          <div>
            <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">Capturas de la reserva</p>
            <BookingReceiptUpload
              initialUrls={initUrls(booking)}
              onUpdate={handleUpdate}
            />
            {saved && (
              <p className="body-3 text-auxiliary-green-5 mt-2">✓ Guardado</p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-1 flex gap-3 shrink-0 bg-white">
          {booking.bookingUrl && (
            <a
              href={booking.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-10 rounded-lg border border-secondary-3 text-secondary-3 body-3 font-bold flex items-center justify-center gap-1.5 hover:bg-secondary-1 transition"
            >
              <ExternalLink className="w-4 h-4" /> Ver en Booking.com
            </a>
          )}
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg bg-neutral-7 text-white body-3 font-bold hover:opacity-90 transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}

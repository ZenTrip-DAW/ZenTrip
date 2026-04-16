import Button from './Button';

export default function ConfirmModal({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', confirmVariant = 'danger', onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-4">
        <h2 className="title-h3-desktop text-secondary-5">{title}</h2>
        {message && <p className="body-2 text-neutral-4">{message}</p>}
        <div className="flex gap-3 mt-2">
          <Button variant="ghost" className="w-auto! flex-1 px-4" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} className="w-auto! flex-1 px-4" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

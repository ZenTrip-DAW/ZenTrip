import Button from '../../../../ui/Button';

export default function ResumenForm({
  form,
  onAtras,
  onCrearViaje,
  isCreatingTrip = false,
  tripCreationLocked = false,
}) {
  const disableCreate = isCreatingTrip || tripCreationLocked;

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-1 p-10 text-center text-neutral-3 body">
        Resumen del viaje — próximamente
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="ghost" type="button" onClick={onAtras} className="w-auto! px-6">
          Atrás
        </Button>
        <Button
          variant="orange"
          type="button"
          className="w-auto! px-6"
          onClick={onCrearViaje}
          disabled={disableCreate}
        >
          {isCreatingTrip ? 'Creando...' : tripCreationLocked ? 'Viaje creado' : 'Crear viaje'}
        </Button>
      </div>
    </div>
  );
}

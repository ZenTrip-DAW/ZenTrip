import Button from '../../../../ui/Button';

export default function ResumenForm({ form, onAtras, onCrearViaje }) {
  return (
    <div>
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-1 p-10 text-center text-neutral-3 body">
        Resumen del viaje — próximamente
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="ghost" type="button" onClick={onAtras} className="w-auto! px-6">
          Atrás
        </Button>
        <Button variant="orange" type="button" className="w-auto! px-6" onClick={onCrearViaje}>
          Crear viaje
        </Button>
      </div>
    </div>
  );
}

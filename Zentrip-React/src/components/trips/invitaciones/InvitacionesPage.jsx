import StepBar from '../create/components/StepBar';
import InvitacionesForm from '../create/components/InvitacionesForm';
import { useInvitacionesController } from './hooks/useInvitacionesController';

export default function InvitacionesPage() {
  const { handleAtras, handleSiguiente } = useInvitacionesController();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="title-h1-mobile md:title-h1-desktop text-secondary-5 mb-6">
          Crear <span className="text-primary-3">nuevo</span> viaje
        </h1>

        <StepBar activeStep={1} />

        <InvitacionesForm onAtras={handleAtras} onSiguiente={handleSiguiente} />
      </div>
    </div>
  );
}

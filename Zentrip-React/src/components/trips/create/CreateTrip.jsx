import { useCreateTripController } from './hooks/useCreateTripController';
import CreateTripForm from './components/CreateTripForm';
import InvitacionesForm from './components/InvitacionesForm';
import ResumenTrip from '../resumen/ResumenTrip';
import StepBar from './components/StepBar';

export default function CreateTrip() {
  const {
    step,
    form,
    fieldErrors,
    handleChange,
    handleSiguiente,
    handleAtras,
  } = useCreateTripController();

  const maxWidth = step === 1 ? 'max-w-5xl' : 'max-w-3xl';

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className={`${maxWidth} mx-auto`}>
        <h1 className="title-h1-mobile md:title-h1-desktop text-secondary-5 mb-6">
          Crear <span className="text-primary-3">nuevo</span> viaje
        </h1>

        <StepBar activeStep={step} />

        {step === 0 && (
          <CreateTripForm
            form={form}
            fieldErrors={fieldErrors}
            onChange={handleChange}
            onSiguiente={handleSiguiente}
            onCancelar={handleAtras}
          />
        )}

        {step === 1 && (
          <InvitacionesForm
            onAtras={handleAtras}
            onSiguiente={handleSiguiente}
          />
        )}

        {step === 2 && (
          <ResumenTrip
            form={form}
            onAtras={handleAtras}
          />
        )}
      </div>
    </div>
  );
}

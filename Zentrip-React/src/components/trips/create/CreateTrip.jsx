import { useCreateTripController } from './hooks/useCreateTripController';
import CreateTripForm from './components/CreateTripForm';
import StepBar from './components/StepBar';

export default function CreateTrip() {
  const {
    form,
    fieldErrors,
    handleChange,
    handleSiguiente,
    handleCancelar,
  } = useCreateTripController();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="title-h1-mobile md:title-h1-desktop text-secondary-5 mb-6">
          Crear <span className="text-primary-3">nuevo</span> viaje
        </h1>

        <StepBar activeStep={0} />

        <CreateTripForm
          form={form}
          fieldErrors={fieldErrors}
          onChange={handleChange}
          onSiguiente={handleSiguiente}
          onCancelar={handleCancelar}
        />
      </div>
    </div>
  );
}

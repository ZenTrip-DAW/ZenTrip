import { useCreateTripController } from './hooks/useCreateTripController';
import CreateTripForm from './components/CreateTripForm';

const STEPS = ['1.Detalles', '2.Invitaciones', '3.Resumen'];

function StepBar({ activeStep = 0 }) {
  return (
    <div className="flex mb-8">
      {STEPS.map((step, i) => {
        const isActive = i === activeStep;
        const isFirst = i === 0;
        const isLast = i === STEPS.length - 1;

        const arrowStyle = {
          clipPath: isFirst
            ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
            : isLast
            ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)'
            : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)',
        };

        return (
          <div
            key={step}
            style={arrowStyle}
            className={`px-5 py-2 body-2-semibold select-none ${
              isActive
                ? 'bg-secondary-5 text-white'
                : 'bg-secondary-1 text-secondary-5'
            } ${i > 0 ? '-ml-1' : ''}`}
          >
            {step}
          </div>
        );
      })}
    </div>
  );
}

export default function CreateTrip() {
  const {
    form,
    fieldErrors,
    guardando,
    error,
    handleChange,
    handleSiguiente,
    handleCancelar,
  } = useCreateTripController();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Título */}
        <h1 className="title-h1-mobile md:title-h1-desktop text-secondary-5 mb-6">
          Crear <span className="text-primary-3">nuevo</span> viaje
        </h1>

        {/* Tabs de pasos */}
        <StepBar activeStep={0} />

        {/* Formulario */}
        <CreateTripForm
          form={form}
          fieldErrors={fieldErrors}
          error={error}
          guardando={guardando}
          onChange={handleChange}
          onSiguiente={handleSiguiente}
          onCancelar={handleCancelar}
        />
      </div>
    </div>
  );
}

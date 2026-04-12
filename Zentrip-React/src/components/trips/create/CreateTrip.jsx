import { useCreateTripController } from './hooks/useCreateTripController';
import StepBar from './components/StepBar';
import DetailsForm from './components/details/DetailsForm';
import InvitationsForm from './components/invitations/InvitationsForm';
import SummaryForm from './components/summary/SummaryForm';

export default function CreateTrip() {
  const {
    step,
    form,
    recientes,
    fieldErrors,
    isCreatingTrip,
    tripCreationLocked,
    enlaceInvitacion,
    handleChange,
    handleSiguiente,
    handleAtras,
    handleGoToStep,
    handleCancelarViaje,
    handleGuardarBorrador,
    handleAgregarMiembro,
    handleAgregarInvitadoEmail,
    handleEliminarInvitado,
    handleCrearViaje,
  } = useCreateTripController();

  const maxWidth = 'max-w-4xl';

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className={`${maxWidth} mx-auto`}>
        <h1 className="title-h1-mobile md:title-h1-desktop text-secondary-5 mb-6">
          Crear <span className="text-primary-3">nuevo</span> viaje
        </h1>

        <StepBar activeStep={step} onStepClick={handleGoToStep} />

        {step === 0 && (
          <DetailsForm
            form={form}
            fieldErrors={fieldErrors}
            onChange={handleChange}
            onSiguiente={handleSiguiente}
            onCancelar={handleAtras}
          />
        )}

        {step === 1 && (
          <InvitationsForm
            recientes={recientes}
            participantes={form.miembros}
            enlaceInvitacion={enlaceInvitacion}
            onAtras={handleAtras}
            onSiguiente={handleSiguiente}
            onAgregarMiembro={handleAgregarMiembro}
            onAgregarInvitadoEmail={handleAgregarInvitadoEmail}
            onEliminarParticipante={handleEliminarInvitado}
          />
        )}

        {step === 2 && (
          <SummaryForm
            form={form}
            onAtras={handleAtras}
            onCrearViaje={handleCrearViaje}
            onCancelar={handleCancelarViaje}
            onGuardarBorrador={handleGuardarBorrador}
            isCreatingTrip={isCreatingTrip}
            tripCreationLocked={tripCreationLocked}
          />
        )}
      </div>
    </div>
  );
}

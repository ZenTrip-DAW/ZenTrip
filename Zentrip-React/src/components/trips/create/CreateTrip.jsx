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
    isEditing,
    inviteLink,
    handleChange,
    handleNext,
    handleBack,
    handleGoToStep,
    handleCancel,
    handleSaveDraft,
    handleAddMember,
    handleAddEmailGuest,
    handleRemoveMember,
    handleCreateTrip,
  } = useCreateTripController();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="title-h1-mobile md:title-h1-desktop text-secondary-5 mb-6">
          {isEditing
            ? <>Editar <span className="text-primary-3">viaje</span></>
            : <>Crear <span className="text-primary-3">nuevo</span> viaje</>}
        </h1>

        <StepBar activeStep={step} onStepClick={handleGoToStep} />

        {step === 0 && (
          <DetailsForm
            form={form}
            fieldErrors={fieldErrors}
            onChange={handleChange}
            onNext={handleNext}
            onCancel={handleBack}
          />
        )}

        {step === 1 && (
          <InvitationsForm
            recientes={recientes}
            participantes={form.members}
            enlaceInvitacion={inviteLink}
            onAtras={handleBack}
            onSiguiente={handleNext}
            onAgregarMiembro={handleAddMember}
            onAgregarInvitadoEmail={handleAddEmailGuest}
            onEliminarParticipante={handleRemoveMember}
          />
        )}

        {step === 2 && (
          <SummaryForm
            form={form}
            onBack={handleBack}
            onCreateTrip={handleCreateTrip}
            onCancel={handleCancel}
            onSaveDraft={handleSaveDraft}
            isCreatingTrip={isCreatingTrip}
            tripCreationLocked={tripCreationLocked}
            isEditing={isEditing}
          />
        )}
      </div>
    </div>
  );
}

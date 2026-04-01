import StepBar from '../create/components/StepBar';

export default function ResumenTrip() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="title-h1-mobile md:title-h1-desktop text-secondary-5 mb-6">
          Crear <span className="text-primary-3">nuevo</span> viaje
        </h1>

        <StepBar activeStep={2} />

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center text-slate-400 body">
          Resumen del viaje — próximamente
        </div>
      </div>
    </div>
  );
}

import Button from '../../../ui/Button';

export default function LoginLeftPanel({ heroImg, logoImg, onGoBack }) {
  return (
    <div className="relative hidden md:flex flex-col justify-between p-13 pt-10 text-white overflow-hidden min-h-520px">
      <img
        src={heroImg}
        alt="Amigos de viaje"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 44, 81, 0.75)' }} />

      <Button
        variant="ghost"
        type="button"
        onClick={onGoBack}
        className="relative z-10 w-fit! self-start mb-2 px-2.5 py-1.5 text-cuerpo-3 text-white border-white/30 hover:bg-white/15"
      >
        <span aria-hidden="true" className="text-cuerpo-3 leading-none">← </span>
        <span>Atrás</span>
      </Button>

      <div className="relative z-10 flex items-center gap-2">
        <img src={logoImg} alt="ZenTrip" className="w-20 h-20" />
        <div className="flex flex-col mt-6">
          <span className="title-h2-desktop text-white tracking-tight">
            Zen<span className="text-primary-3">Trip</span>
          </span>
          <span className="title-h3-desktop text-white -mt-2">Plan, Pack &amp; GO</span>
        </div>
      </div>

      <div className="relative z-10 mb-auto mt-13">
        <h2 className="font-[Montserrat] text-[38px] font-bold text-white leading-tight" >
          Tu próxima<br />aventura<br />empieza aquí.
        </h2>
        <p className="body text-white mt-15 max-w-xs leading-relaxed ">
          Todo lo que necesitas para planificar, organizar y viajar sin caos.
        </p>
      </div>
    </div>
  );
}

const STEPS = ['1.Detalles', '2.Invitaciones', '3.Resumen'];

export default function StepBar({ activeStep = 0 }) {
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

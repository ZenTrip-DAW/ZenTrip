const STEPS = ['1.Detalles', '2.Invitaciones', '3.Resumen'];

export default function StepBar({ activeStep = 0, onStepClick }) {
  return (
    <div className="flex mb-8">
      {STEPS.map((step, i) => {
        const isActive = i === activeStep;
        const isVisited = i < activeStep;
        const isFirst = i === 0;
        const isLast = i === STEPS.length - 1;
        const isClickable = isVisited;

        const arrowStyle = {
          clipPath: isFirst
            ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
            : isLast
            ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)'
            : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)',
        };

        return (
          <button
            key={step}
            type="button"
            style={arrowStyle}
            disabled={!isClickable}
            onClick={() => isClickable && onStepClick?.(i)}
            className={`px-5 py-2 body-2-semibold select-none transition-opacity ${
              isActive
                ? 'bg-secondary-5 text-white'
                : 'bg-secondary-1 text-secondary-5'
            } ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'} ${i > 0 ? '-ml-1' : ''}`}
          >
            {step}
          </button>
        );
      })}
    </div>
  );
}

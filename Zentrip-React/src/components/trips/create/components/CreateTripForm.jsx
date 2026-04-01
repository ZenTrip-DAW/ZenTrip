import currency from 'currency.js';
import Select from 'react-select';
import Input from '../../../ui/Input';
import Button from '../../../ui/Button';
import { DIVISAS } from '../../../../utils/divisas';

export function formatCurrency(amount, divisaCode) {
  const divisa = DIVISAS.find((d) => d.code === divisaCode) ?? DIVISAS[0];
  return currency(amount, {
    symbol: divisa.symbol,
    decimal: divisa.decimal,
    separator: divisa.separator,
    precision: divisa.precision ?? 2,
  }).format();
}

const DIVISA_OPTIONS = DIVISAS.map((d) => ({ value: d.code, label: d.label }));

const labelClass = 'block text-slate-600 mb-1 body-bold';

const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderColor: state.isFocused ? 'transparent' : '#cbd5e1',
    boxShadow: state.isFocused ? '0 0 0 2px #f97316' : 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    color: '#334155',
    '&:hover': { borderColor: '#cbd5e1' },
  }),
  option: (base, state) => ({
    ...base,
    fontSize: '0.875rem',
    backgroundColor: state.isSelected ? '#f97316' : state.isFocused ? '#fff7ed' : 'white',
    color: state.isSelected ? 'white' : '#334155',
  }),
  singleValue: (base) => ({ ...base, color: '#334155' }),
};

export default function CreateTripForm({
  form,
  fieldErrors,
  onChange,
  onSiguiente,
  onCancelar,
}) {
  return (
    <form onSubmit={onSiguiente} noValidate>
      {/* Información básica */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
        <h2 className="title-h3-desktop text-secondary-5 mb-5">Información básica</h2>

        {/* Nombre del viaje */}
        <div className="mb-4">
          <Input
            variant="light"
            label="Nombre del viaje"
            name="nombre"
            placeholder="Ej. Roadtrip Costa Oeste"
            value={form.nombre}
            onChange={onChange}
            error={fieldErrors.nombre}
            required
          />
        </div>

        {/* Origen y Destino */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Input
            variant="light"
            label="Origen"
            name="origen"
            placeholder="Ej. Madrid, España"
            value={form.origen}
            onChange={onChange}
            error={fieldErrors.origen}
          />
          <Input
            variant="light"
            label="Destino"
            name="destino"
            placeholder="Ej. Paris, Francia"
            value={form.destino}
            onChange={onChange}
            error={fieldErrors.destino}
          />
        </div>

        {/* Fechas y Divisa */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <Input
              variant="light"
              label="Fecha inicio"
              name="fechaInicio"
              type="date"
              value={form.fechaInicio}
              onChange={onChange}
              error={fieldErrors.fechaInicio}
            />
          </div>
          <div>
            <Input
              variant="light"
              label="Fecha fin"
              name="fechaFin"
              type="date"
              value={form.fechaFin}
              onChange={onChange}
              error={fieldErrors.fechaFin}
              min={form.fechaInicio || undefined}
            />
          </div>
          <div>
            <label className={labelClass}>
              Divisa <span className="text-red-500 ml-0.5">*</span>
            </label>
            <Select
              inputId="divisa"
              options={DIVISA_OPTIONS}
              value={DIVISA_OPTIONS.find((o) => o.value === form.divisa) ?? null}
              onChange={(option) =>
                onChange({ target: { name: 'divisa', value: option?.value ?? '' } })
              }
              styles={selectStyles}
              placeholder="Selecciona divisa..."
              noOptionsMessage={() => 'Sin resultados'}
            />
            {fieldErrors.divisa && (
              <p className="mt-1 body-3 text-feedback-error">{fieldErrors.divisa}</p>
            )}
          </div>
        </div>

        {/* Presupuesto y Mascota */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <Input
            variant="light"
            label="Presupuesto"
            name="presupuesto"
            type="number"
            placeholder="Ej. 1200"
            value={form.presupuesto}
            onChange={onChange}
            error={fieldErrors.presupuesto}
            min="0"
            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <div className="flex items-center gap-3 pb-2">
            <span className="body text-slate-600">¿Viajas con Mascota?</span>
            <button
              type="button"
              role="switch"
              aria-checked={form.conMascota}
              onClick={() =>
                onChange({ target: { name: 'conMascota', type: 'checkbox', checked: !form.conMascota } })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-secondary-3 focus:ring-offset-1 ${
                form.conMascota ? 'bg-secondary-3' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  form.conMascota ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>


      {/* Botones */}
      <div className="flex justify-end gap-3">
        <Button variant="ghost" type="button" onClick={onCancelar} className="w-auto px-6">
          Cancelar
        </Button>
        <Button variant="orange" type="submit" className="w-auto px-8">
          Siguiente
        </Button>
      </div>
    </form>
  );
}

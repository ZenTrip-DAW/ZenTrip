import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Search, MapPin, Calendar, BedDouble, Users, Baby } from 'lucide-react';
import { SectionLabel } from './HotelAtoms';

function FormField({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1 body-3 font-bold text-neutral-5 uppercase tracking-wider mb-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      {children}
    </div>
  );
}

function NumberInput({ value, onChange, min = 1 }) {
  return (
    <input
      type="number"
      min={min}
      value={value}
      onChange={onChange}
      className="w-full h-10 px-3 border border-neutral-2 rounded-lg body-2 text-neutral-7 bg-white outline-none focus:border-secondary-3 focus:ring-2 focus:ring-secondary-3/20 transition"
    />
  );
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function DateInput({ value, onChange }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 2);

  const years = [];
  for (let y = today.getFullYear(); y <= maxDate.getFullYear(); y++) years.push(y);

  const selected = value ? new Date(value + 'T00:00:00') : null;

  const handleChange = (date) => {
    if (!date) { onChange({ target: { value: '' } }); return; }
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    onChange({ target: { value: `${yyyy}-${mm}-${dd}` } });
  };

  return (
    <DatePicker
      selected={selected}
      onChange={handleChange}
      minDate={today}
      maxDate={maxDate}
      dateFormat="dd/MM/yyyy"
      placeholderText="dd/mm/aaaa"
      wrapperClassName="w-full"
      className="w-full h-10 px-3 border border-neutral-2 rounded-lg body-2 text-neutral-7 bg-white outline-none focus:border-secondary-3 focus:ring-2 focus:ring-secondary-3/20 transition"
      renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
        <div className="flex items-center justify-between px-2 py-1 gap-1">
          <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="px-1 text-lg disabled:opacity-30 hover:text-primary-3">‹</button>
          <div className="flex gap-1">
            <select
              value={date.getMonth()}
              onChange={(e) => changeMonth(Number(e.target.value))}
              className="text-xs border border-neutral-2 rounded px-1 py-0.5"
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select
              value={date.getFullYear()}
              onChange={(e) => changeYear(Number(e.target.value))}
              className="text-xs border border-neutral-2 rounded px-1 py-0.5"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="px-1 text-lg disabled:opacity-30 hover:text-primary-3">›</button>
        </div>
      )}
    />
  );
}

export default function HotelSearchForm({
  dest, onDestChange,
  checkIn, onCheckInChange,
  checkOut, onCheckOutChange,
  rooms, onRoomsChange,
  adults, onAdultsChange,
  children, onChildrenChange,
  loading, canSearch,
  onSearch,
}) {
  return (
    <div className="bg-white border border-neutral-1 rounded-2xl p-4 sm:p-6 shadow-sm">
      <SectionLabel>Buscar alojamiento</SectionLabel>

      {/* Destino */}
      <div className="mb-4">
        <FormField label="Destino" icon={MapPin}>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-3 pointer-events-none" />
            <input
              type="text"
              value={dest}
              onChange={(e) => onDestChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder="Ciudad, hotel o zona…"
              className="w-full h-12 pl-9 pr-3 border-2 border-neutral-2 rounded-lg body-2 text-neutral-7 bg-white outline-none focus:border-primary-3 focus:ring-2 focus:ring-primary-3/10 transition placeholder:text-neutral-3"
            />
          </div>
        </FormField>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <FormField label="Entrada" icon={Calendar}>
          <DateInput value={checkIn} onChange={(e) => onCheckInChange(e.target.value)} />
        </FormField>
        <FormField label="Salida" icon={Calendar}>
          <DateInput value={checkOut} onChange={(e) => onCheckOutChange(e.target.value)} />
        </FormField>
      </div>

      {/* Ocupación */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <FormField label="Habitaciones" icon={BedDouble}>
          <NumberInput value={rooms} onChange={(e) => onRoomsChange(Math.max(1, Number(e.target.value)))} />
        </FormField>
        <FormField label="Adultos" icon={Users}>
          <NumberInput value={adults} onChange={(e) => onAdultsChange(Math.max(1, Number(e.target.value)))} />
        </FormField>
        <FormField label="Niños" icon={Baby}>
          <NumberInput min={0} value={children} onChange={(e) => onChildrenChange(Math.max(0, Number(e.target.value)))} />
        </FormField>
      </div>

      <div className="border-t border-neutral-1 mb-6" />

      <button
        onClick={onSearch}
        disabled={!canSearch || loading}
        className={`w-full h-12 rounded-lg font-titles font-bold text-white flex items-center justify-center gap-2 transition ${
          canSearch && !loading ? 'bg-primary-3 hover:bg-primary-4' : 'bg-neutral-2 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Buscando…
          </>
        ) : (
          <><Search className="w-4 h-4" /> Buscar hoteles</>
        )}
      </button>
    </div>
  );
}

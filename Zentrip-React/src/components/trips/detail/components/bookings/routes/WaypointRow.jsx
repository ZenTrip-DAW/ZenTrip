import { useRef, useState } from 'react';
import { GripVertical, X } from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';

export default function WaypointRow({ wp, index, total, onChange, onRemove, onMove, isLoaded }) {
  const acRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handlePlaceChanged = () => {
    const place = acRef.current?.getPlace();
    const name = place?.formatted_address || place?.name || '';
    if (name) onChange(wp.id, name);
  };

  const isFirst = index === 0;
  const isLast = index === total - 1;
  const dotColor = isFirst || isLast ? 'bg-auxiliary-green-5' : 'bg-primary-3';

  const inputEl = (
    <input
      value={wp.value}
      onChange={(e) => onChange(wp.id, e.target.value)}
      placeholder={isFirst ? 'Punto de salida…' : isLast ? 'Destino final…' : `Parada ${index}…`}
      className={`w-full h-10 px-3 border rounded-lg body-2 text-neutral-7 bg-white outline-none focus:ring-2 focus:ring-primary-3/10 transition placeholder:text-neutral-3 ${
        wp.fromActivity ? 'border-amber-400 focus:border-amber-400' : 'border-neutral-2 focus:border-primary-3'
      }`}
    />
  );

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(index)); e.dataTransfer.effectAllowed = 'move'; }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const from = Number(e.dataTransfer.getData('text/plain')); if (from !== index) onMove(from, index); }}
      onDragEnd={() => setIsDragOver(false)}
      className={`flex items-start gap-2 mb-1 transition-opacity ${isDragOver ? 'opacity-50' : ''}`}
    >
      <div className="shrink-0 pt-3 cursor-grab text-neutral-2 hover:text-neutral-4 transition-colors">
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="flex flex-col items-center shrink-0 pt-3">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        {!isLast && <div className="w-px flex-1 min-h-5 bg-neutral-2 mt-1" />}
        {!isLast && <div className="w-px flex-1 min-h-5 bg-neutral-2 mt-1" />}
      </div>

      <div className="flex-1 min-w-0">
        {wp.label && (
          <div className="flex items-center gap-1.5 mb-1">
            <wp.label.Icon className="w-3.5 h-3.5 text-neutral-4 shrink-0" />
            <p className="body-3 text-neutral-4 font-semibold truncate">
              {wp.label.text}{wp.label.name ? ` · ${wp.label.name}` : ''}
            </p>
          </div>
        )}
        {isLoaded ? (
          <Autocomplete onLoad={(ac) => { acRef.current = ac; }} onPlaceChanged={handlePlaceChanged}>
            {inputEl}
          </Autocomplete>
        ) : inputEl}
      </div>

      {total > 2 ? (
        <button
          type="button"
          onClick={() => onRemove(wp.id)}
          className="cursor-pointer shrink-0 mt-1.5 p-1.5 rounded-full text-neutral-3 hover:text-feedback-error hover:bg-feedback-error-bg transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="w-7 shrink-0" />
      )}
    </div>
  );
}

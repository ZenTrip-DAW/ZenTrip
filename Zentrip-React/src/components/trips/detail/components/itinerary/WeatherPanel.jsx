import { Droplets, Wind, CloudSun } from 'lucide-react';

export default function WeatherPanel({ weatherData }) {
  if (!weatherData) {
    return (
      <div className="hidden sm:flex items-center gap-2 border border-neutral-1 rounded-xl px-3 py-2">
        <CloudSun className="w-6 h-6 text-neutral-2" />
        <div className="flex flex-col">
          <span className="body-3 text-neutral-5 font-semibold">—</span>
          <span className="body-3 text-neutral-3 text-xs">Sin datos de clima</span>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden sm:flex items-center gap-3 border border-blue-100 bg-blue-50 rounded-xl px-3 py-2">
      <span className="text-3xl leading-none">{weatherData.emoji}</span>
      <div className="flex flex-col min-w-0">
        <span className="body-2 font-bold text-secondary-5 leading-tight">
          {weatherData.temp != null ? `${weatherData.temp}ºC` : '—'}
        </span>
        <span className="body-3 text-neutral-4 leading-tight truncate">
          {weatherData.description || '—'}
        </span>
      </div>
      {(weatherData.humidity != null || weatherData.windSpeed != null) && (
        <div className="pl-3 border-l border-blue-200 flex flex-col gap-1">
          {weatherData.humidity != null && (
            <span className="flex items-center gap-1 body-3 text-neutral-4 whitespace-nowrap">
              <Droplets className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              {weatherData.humidity}%
            </span>
          )}
          {weatherData.windSpeed != null && (
            <span className="flex items-center gap-1 body-3 text-neutral-4 whitespace-nowrap">
              <Wind className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              {weatherData.windSpeed} km/h
            </span>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sun,
  CloudSun,
  CloudRain,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getWeatherForecast } from '../utils/api';
import { useLocationContext } from '../context/LocationContext';
import { INDIAN_STATES, STATE_DISTRICTS } from '../data/indianLocations';

const WeatherForecast = () => {
  const { location, setLocation } = useLocationContext();

  const [selectedState, setSelectedState] = useState(location?.state || 'Andhra Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState(location?.district || 'Guntur');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  // Available districts for the selected state
  const availableDistricts = STATE_DISTRICTS[selectedState] || [];

  const fetchWeather = useCallback(async (state, district) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getWeatherForecast({ state, district });
      setWeatherData(res.data);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(err?.response?.data?.error || 'Unable to retrieve meteorological data. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(selectedState, selectedDistrict);
  }, [fetchWeather, selectedState, selectedDistrict]);

  const handleStateChange = (e) => {
    const newState = e.target.value;
    setSelectedState(newState);
    const districts = STATE_DISTRICTS[newState] || [];
    const newDistrict = districts.length > 0 ? districts[0] : '';
    setSelectedDistrict(newDistrict);
    setLocation({ state: newState, district: newDistrict });
  };

  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    setSelectedDistrict(newDistrict);
    setLocation({ state: selectedState, district: newDistrict });
  };

  const getWeatherIcon = (code, size = 28) => {
    const c = Number(code);
    if (c === 0 || c === 1) return <Sun size={size} className="text-amber-500" />;
    if (c === 2 || c === 3) return <CloudSun size={size} className="text-emerald-600" />;
    if (c >= 51 && c <= 82) return <CloudRain size={size} className="text-blue-500" />;
    if (c >= 95) return <CloudLightning size={size} className="text-purple-600" />;
    return <CloudSun size={size} className="text-emerald-500" />;
  };

  const formatDateLabel = (dateStr, index) => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-green-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <CloudSun size={260} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold backdrop-blur-sm border border-emerald-400/30">
              <Sparkles size={14} className="text-amber-300" />
              Agrometeorological Intelligence Engine
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Precision Weather & Agricultural Advisories
            </h1>
            <p className="text-emerald-100 text-sm md:text-base leading-relaxed">
              Real-time atmospheric monitoring, 7-day precipitation forecasts, and field-specific spraying & irrigation advisories tailored for your farmland.
            </p>
          </div>

          {/* Location Selector Pill */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 flex flex-col sm:flex-row gap-3 items-center shadow-lg">
            <div className="flex items-center gap-2 text-emerald-200 text-sm font-medium">
              <MapPin size={18} className="text-emerald-400 shrink-0" />
              <span>Location:</span>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <select
                value={selectedState}
                onChange={handleStateChange}
                aria-label="Select State for weather forecast"
                className="bg-emerald-950/70 text-white text-xs md:text-sm font-medium rounded-lg px-3 py-2 border border-emerald-400/30 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st} className="bg-gray-900 text-white">
                    {st}
                  </option>
                ))}
              </select>

              {availableDistricts.length > 0 && (
                <select
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  aria-label="Select District for weather forecast"
                  className="bg-emerald-950/70 text-white text-xs md:text-sm font-medium rounded-lg px-3 py-2 border border-emerald-400/30 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {availableDistricts.map((dst) => (
                    <option key={dst} value={dst} className="bg-gray-900 text-white">
                      {dst}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => fetchWeather(selectedState, selectedDistrict)}
                disabled={loading}
                title="Refresh Weather Data"
                className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors flex items-center justify-center disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
          <AlertTriangle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={() => fetchWeather(selectedState, selectedDistrict)}
            className="ml-auto text-xs underline font-semibold hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state skeleton */}
      {loading && !weatherData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse h-96"></div>
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse h-96"></div>
        </div>
      )}

      {weatherData && (
        <>
          {/* Fallback baseline honest notification if live API was unreachable */}
          {weatherData.is_fallback && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800 text-sm">
              <AlertTriangle size={20} className="shrink-0 text-amber-600" />
              <div>
                <span className="font-semibold">Regional Baseline Mode: </span>
                {weatherData.fallback_reason || 'Currently displaying verified historical climate normals for this agro-climatic zone.'}
              </div>
            </div>
          )}

          {/* Current Conditions & Quick Stats Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary Current Card */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-emerald-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Live Atmospheric State
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {weatherData.location?.district}, {weatherData.location?.state}
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-6">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    {getWeatherIcon(weatherData.current?.weather_code, 52)}
                  </div>
                  <div>
                    <div className="text-5xl font-black text-gray-900 tracking-tight">
                      {weatherData.current?.temperature}°C
                    </div>
                    <div className="text-sm font-semibold text-emerald-800 capitalize mt-1">
                      {weatherData.current?.condition}
                    </div>
                    <div className="text-xs text-gray-500">
                      Feels like {weatherData.current?.feels_like}°C
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-xs text-gray-600 italic">
                  &ldquo;{weatherData.current?.description}&rdquo;
                </p>
              </div>

              {/* Environmental Metrics Grid */}
              <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <Droplets size={18} className="mx-auto text-blue-500 mb-1" />
                  <div className="text-xs text-gray-500 font-medium">Humidity</div>
                  <div className="text-sm font-bold text-gray-800">{weatherData.current?.humidity}%</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <Wind size={18} className="mx-auto text-teal-500 mb-1" />
                  <div className="text-xs text-gray-500 font-medium">Wind Speed</div>
                  <div className="text-sm font-bold text-gray-800">{weatherData.current?.wind_speed} km/h</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <CloudRain size={18} className="mx-auto text-indigo-500 mb-1" />
                  <div className="text-xs text-gray-500 font-medium">Precip.</div>
                  <div className="text-sm font-bold text-gray-800">{weatherData.current?.precipitation} mm</div>
                </div>
              </div>

              <div className="mt-4 text-[11px] text-gray-400 text-center">
                Data Source: <span className="font-medium text-gray-600">{weatherData.source}</span>
              </div>
            </div>

            {/* Farm Management Advisories (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-emerald-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={20} className="text-emerald-700" />
                    <h2 className="text-lg font-bold text-gray-900">
                      Automated Agronomic Field Advisories
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                    Derived from 48h Weather Vector
                  </span>
                </div>

                <div className="space-y-3.5">
                  {(weatherData.advisories || []).map((adv, idx) => {
                    const isWarn = adv.severity === 'warning';
                    const isPos = adv.severity === 'positive';
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all ${
                          isWarn
                            ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                            : isPos
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                            : 'bg-blue-50/60 border-blue-200 text-blue-950'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {isWarn ? (
                            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="text-sm font-bold">{adv.title}</div>
                            <div className="text-xs mt-1 leading-relaxed opacity-90">
                              {adv.message}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons to Integrated Modules */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                <Link
                  to="/crop-recommendation"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  <span>Apply to Crop Recommendation</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  to="/soil-health"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Thermometer size={14} />
                  <span>Inspect Soil Moisture</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 7-Day Precision Agronomic Forecast Strip */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-emerald-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-emerald-700" />
                <h2 className="text-lg font-bold text-gray-900">
                  7-Day Agrometeorological Outlook
                </h2>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                Day-by-day temperatures & precipitation probabilities
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {(weatherData.daily || []).map((day, idx) => (
                <div
                  key={day.date}
                  className={`p-4 rounded-xl border text-center flex flex-col justify-between transition-all hover:shadow-md ${
                    idx === 0
                      ? 'bg-gradient-to-b from-emerald-50 to-white border-emerald-300 ring-2 ring-emerald-500/20'
                      : 'bg-gray-50/50 hover:bg-white border-gray-100'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-gray-700">
                      {formatDateLabel(day.date, idx)}
                    </div>
                    <div className="my-3 flex justify-center">
                      {getWeatherIcon(day.weather_code, 32)}
                    </div>
                    <div className="text-xs font-medium text-gray-600 truncate">
                      {day.condition}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-sm font-extrabold text-gray-900">
                      {day.max_temp}° <span className="text-gray-400 font-normal text-xs">/ {day.min_temp}°</span>
                    </div>

                    <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 py-0.5 rounded-md">
                      <Droplets size={11} />
                      <span>{day.precipitation_probability}%</span>
                    </div>

                    {day.precipitation_sum > 0 && (
                      <div className="text-[10px] text-gray-400 mt-1">
                        {day.precipitation_sum} mm rain
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WeatherForecast;

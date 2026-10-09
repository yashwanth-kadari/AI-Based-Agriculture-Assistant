import React from 'react';

/**
 * Reusable soil & environment input form used across prediction pages.
 * Keeps UI consistent and reduces duplicate code.
 */
const SoilInputForm = ({ formData, onChange, children }) => {
  const fields = [
    { name: 'N', label: 'Nitrogen (N)', col: 'sm:col-span-1' },
    { name: 'P', label: 'Phosphorus (P)', col: 'sm:col-span-1' },
    { name: 'K', label: 'Potassium (K)', col: 'sm:col-span-1' },
    { name: 'temperature', label: 'Temperature (°C)', col: 'sm:col-span-1' },
    { name: 'humidity', label: 'Humidity (%)', col: 'sm:col-span-1' },
    { name: 'ph', label: 'pH Level', col: 'sm:col-span-1' },
    { name: 'rainfall', label: 'Rainfall (mm)', col: 'sm:col-span-2' },
  ];

  const inputClass =
    'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-eco-500 focus:border-eco-500 text-sm';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {fields.slice(0, 3).map((f) => (
          <div key={f.name}>
            <label className="block text-xs font-medium text-gray-700">{f.label}</label>
            <input
              type="number"
              step="any"
              name={f.name}
              required
              value={formData[f.name]}
              onChange={onChange}
              className={inputClass}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
        {fields.slice(3).map((f) => (
          <div key={f.name} className={f.col}>
            <label className="block text-xs font-medium text-gray-700">{f.label}</label>
            <input
              type="number"
              step="any"
              name={f.name}
              required
              value={formData[f.name]}
              onChange={onChange}
              className={inputClass}
            />
          </div>
        ))}
      </div>
      {children}
    </div>
  );
};

export default SoilInputForm;

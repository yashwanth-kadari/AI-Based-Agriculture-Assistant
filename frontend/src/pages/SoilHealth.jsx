import React, { useState, useEffect, useCallback } from 'react';
import { Droplet, AlertCircle, Beaker, CloudRain, FlaskConical } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import SubmissionHistory from '../components/SubmissionHistory';
import { analyzeSoil, getSoilReports } from '../utils/api';

const DEFAULT_FORM = { N: '80', P: '40', K: '30', ph: '6.8', temperature: '', humidity: '', rainfall: '' };

const getNutrientTheme = (status) => {
  const s = (status || '').toString().toLowerCase();
  if (s.includes('optimal') || s.includes('good') || s.includes('ideal') || s.includes('balanced')) {
    return { bg: 'bg-emerald-50/90 text-emerald-900 border-emerald-300', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', text: 'text-emerald-700' };
  }
  if (s.includes('medium') || s.includes('fair') || s.includes('adequate') || s.includes('moderate')) {
    return { bg: 'bg-amber-50/90 text-amber-900 border-amber-300', badge: 'bg-amber-100 text-amber-800 border-amber-300', text: 'text-amber-700' };
  }
  return { bg: 'bg-red-50/90 text-red-900 border-red-300', badge: 'bg-red-100 text-red-800 border-red-300', text: 'text-red-700' };
};

const SoilHealth = ({ user }) => {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');

  const fetchReports = useCallback(async () => {
    if (!user?.id) return;
    setReportsLoading(true);
    try {
      const { data } = await getSoilReports(user.id);
      setReports(data.reports || []);
    } catch (e) {
      console.error('Failed to load soil reports', e);
    } finally {
      setReportsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.N || !formData.P || !formData.K || !formData.ph) {
      setError('Please provide mandatory N, P, K and pH soil test parameters.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await analyzeSoil({ ...formData, user_id: user?.id });
      setResult(data);
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.error || 'Soil analysis failed. Please check values.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-eco-500 focus:border-eco-500 text-sm bg-white';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Soil Health & Nutrient Analysis</h1>
        <p className="text-gray-500 text-sm mt-1">
          Detailed NPK nutrient diagnosis, soil acidity balance, fertilizer management, and irrigation guidance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Card */}
        <Card title="Soil Test Parameters" icon={FlaskConical}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Mandatory Soil Test Values
            </p>
            {/* NPK Row */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 truncate">
                  Nitrogen (N) (mg/kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  name="N"
                  required
                  value={formData.N}
                  onChange={handleChange}
                  placeholder="e.g. 80"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 truncate">
                  Phosphorus (P) (mg/kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  name="P"
                  required
                  value={formData.P}
                  onChange={handleChange}
                  placeholder="e.g. 40"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 truncate">
                  Potassium (K) (mg/kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  name="K"
                  required
                  value={formData.K}
                  onChange={handleChange}
                  placeholder="e.g. 30"
                  className={inputClass}
                />
              </div>
            </div>

            {/* pH Row */}
            <div>
              <label className="block text-xs font-semibold text-gray-700">
                Soil pH Level <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="3"
                max="10"
                name="ph"
                required
                value={formData.ph}
                onChange={handleChange}
                placeholder="Target range: 5.5 - 7.5"
                className={inputClass}
              />
            </div>

            {/* Climate Data (Optional) */}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Environmental Conditions
                </span>
                <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                  Optional
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-gray-500">Temp (°C)</label>
                  <input
                    type="number"
                    step="any"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleChange}
                    placeholder="e.g. 25"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-gray-500">Humidity (%)</label>
                  <input
                    type="number"
                    step="any"
                    name="humidity"
                    value={formData.humidity}
                    onChange={handleChange}
                    placeholder="e.g. 65"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-gray-500">Rainfall (mm)</label>
                  <input
                    type="number"
                    step="any"
                    name="rainfall"
                    value={formData.rainfall}
                    onChange={handleChange}
                    placeholder="e.g. 120"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full py-2.5 mt-2" isLoading={loading} icon={Droplet}>
              Analyze Soil Health
            </Button>
          </form>
        </Card>

        {/* Results Panel */}
        <div className="space-y-4">
          {error && (
            <Card className="bg-red-50 border-red-200">
              <div className="flex items-start text-red-700 gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            </Card>
          )}

          {result ? (() => {
            const phVal = parseFloat(result.ph || 7);
            const phStatus = (phVal >= 6.0 && phVal <= 7.5) ? 'Optimal' : (phVal >= 5.5 && phVal <= 8.0) ? 'Adequate' : phVal < 5.5 ? 'Acidic Deficient' : 'Alkaline High';
            const phTheme = getNutrientTheme(phStatus);
            const overallTheme = getNutrientTheme(result.health_status);

            return (
              <>
                <Card className={`border shadow-sm ${overallTheme.bg}`} title={`Overall Soil Health: ${result.health_status}`} icon={Droplet}>
                  <p className="text-xs text-gray-700 mb-4 font-medium leading-relaxed">{result.npk_summary}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['nitrogen', 'phosphorus', 'potassium'].map((nutrient) => {
                      const d = result.npk_analysis[nutrient];
                      const theme = getNutrientTheme(d.status);
                      return (
                        <div key={nutrient} className={`p-3 rounded-xl text-center border shadow-xs ${theme.bg}`}>
                          <p className="text-[11px] font-bold uppercase tracking-wider">{nutrient.slice(0, 1)} ({nutrient})</p>
                          <p className={`text-xl font-black mt-1 ${theme.text}`}>{d.value} <span className="text-[10px] font-normal text-gray-600">mg/kg</span></p>
                          <span className={`inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold rounded-full border ${theme.badge}`}>
                            {d.status}
                          </span>
                        </div>
                      );
                    })}

                    <div className={`p-3 rounded-xl text-center border shadow-xs ${phTheme.bg}`}>
                      <p className="text-[11px] font-bold uppercase tracking-wider">pH Level</p>
                      <p className={`text-xl font-black mt-1 ${phTheme.text}`}>{result.ph}</p>
                      <span className={`inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold rounded-full border ${phTheme.badge}`}>
                        {phStatus}
                      </span>
                    </div>
                  </div>

                  {user?.state && (
                    <div className="mt-4 pt-3 border-t border-gray-200/60 flex justify-between items-center text-xs text-gray-600 font-medium">
                      <span>Regional Location:</span>
                      <span className="font-bold text-gray-800">{user.district || ''}, {user.state}</span>
                    </div>
                  )}
                </Card>

                <Card title="Fertilizer Action Plan" icon={Beaker}>
                  <p className="text-xs text-gray-700 leading-relaxed font-medium">{result.fertilizer_recommendation}</p>
                </Card>

                <Card title="Irrigation Guidance" icon={CloudRain}>
                  <p className="text-xs text-gray-700 leading-relaxed font-medium">{result.irrigation_suggestion}</p>
                </Card>
              </>
            );
          })() : (
            <Card className="flex flex-col items-center justify-center text-gray-400 min-h-[280px] border-dashed border-2">
              <Droplet className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm text-center px-4">
                Enter your soil NPK test values and pH level to generate your report.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* PAST SUBMISSIONS HISTORY PANEL */}
      <SubmissionHistory
        title="Past Soil Health Records"
        records={reports}
        loading={reportsLoading}
        type="soil"
        onRefresh={fetchReports}
      />
    </div>
  );
};

export default SoilHealth;


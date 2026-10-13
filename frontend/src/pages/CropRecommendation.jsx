import React, { useState, useEffect, useCallback } from 'react';
import { Sprout, CheckCircle, AlertCircle, FlaskConical, Info, Sparkles } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import SubmissionHistory from '../components/SubmissionHistory';
import { predictCrop, getSoilReports, getCropHistory } from '../utils/api';


const PRESETS = {
  Rice: { N: '90', P: '42', K: '43', ph: '6.5', temperature: '21', humidity: '82', rainfall: '220' },
  Wheat: { N: '75', P: '45', K: '22', ph: '6.3', temperature: '22', humidity: '22', rainfall: '68' },
  Maize: { N: '100', P: '16', K: '30', ph: '6.7', temperature: '25', humidity: '60', rainfall: '145' },
  Cotton: { N: '36', P: '69', K: '32', ph: '5.8', temperature: '29', humidity: '87', rainfall: '123' },
};

const CropRecommendation = ({ user }) => {
  const [formData, setFormData] = useState({
    N: '',
    P: '',
    K: '',
    ph: '',
    temperature: '',
    humidity: '',
    rainfall: '',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [autofilled, setAutofilled] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const { data } = await getCropHistory();
      setHistoryRecords(data?.history || []);
    } catch (err) {
      console.error('Error fetching crop history:', err);
    } finally {
      setHistoryLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Manual auto-fill from user's latest soil report on demand
  const handleAutoFill = async () => {
    try {
      if (!user) return;
      const { data } = await getSoilReports();
      if (data?.reports && data.reports.length > 0) {
        const latest = data.reports[0];
        setFormData({
          N: latest.n_content != null ? String(latest.n_content) : '',
          P: latest.p_content != null ? String(latest.p_content) : '',
          K: latest.k_content != null ? String(latest.k_content) : '',
          ph: latest.ph != null ? String(latest.ph) : '',
          temperature: latest.temperature != null ? String(latest.temperature) : '',
          humidity: latest.humidity != null ? String(latest.humidity) : '',
          rainfall: latest.rainfall != null ? String(latest.rainfall) : '',
        });
        setAutofilled(true);
        setError('');
      } else {
        setError('No previous soil test report found. Please enter parameters manually.');
      }
    } catch {
      setError('Could not fetch soil report for auto-fill. Please enter values manually.');
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const applyPreset = (name) => {
    setFormData(PRESETS[name]);
    setResult(null);
    setError('');
  };

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
      const payload = {
        N: formData.N,
        P: formData.P,
        K: formData.K,
        ph: formData.ph,
        temperature: formData.temperature || undefined,
        humidity: formData.humidity || undefined,
        rainfall: formData.rainfall || undefined,
        state: user?.state,
      };

      const { data } = await predictCrop(payload);
      setResult(data);
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get crop recommendation. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };


  const inputClass = (field) => {
    const isMandatory = ['N', 'P', 'K', 'ph'].includes(field);
    const missing = error && isMandatory && (formData[field] === '' || formData[field] == null);
    return `mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-eco-500 text-sm bg-white ${missing ? 'border-red-400 focus:border-red-400 focus:ring-red-300' : 'border-gray-200 focus:border-eco-500'
      }`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Crop Recommendation</h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter your soil testing and environmental parameters to receive optimal crop recommendations.
          </p>
        </div>

        {user?.id && (
          <button
            type="button"
            onClick={handleAutoFill}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-eco-50 text-eco-700 border border-eco-200 hover:bg-eco-100 transition-colors self-start"
          >
            <Sparkles className="h-3.5 w-3.5 text-eco-600" />
            {autofilled ? 'Soil Report Synced' : 'Auto-fill from Soil Report'}
          </button>
        )}
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quick Presets:</span>
        {Object.keys(PRESETS).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => applyPreset(name)}
            className="px-3 py-1 text-xs font-semibold rounded-full bg-eco-50 text-eco-700 border border-eco-100 hover:bg-eco-100 transition-colors"
          >
            {name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Form */}
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
                  value={formData.N}
                  onChange={handleChange}
                  placeholder="e.g. 80"
                  className={inputClass('N')}
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
                  value={formData.P}
                  onChange={handleChange}
                  placeholder="e.g. 40"
                  className={inputClass('P')}
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
                  value={formData.K}
                  onChange={handleChange}
                  placeholder="e.g. 30"
                  className={inputClass('K')}
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
                value={formData.ph}
                onChange={handleChange}
                placeholder="Target range: 5.5 - 7.5"
                className={inputClass('ph')}
              />
            </div>

            {/* Environmental Conditions (Optional) */}
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
                    className={inputClass('temperature')}
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
                    className={inputClass('humidity')}
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
                    className={inputClass('rainfall')}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full py-2.5 mt-2" isLoading={loading} icon={Sprout}>
              Get Crop Recommendation
            </Button>
          </form>
        </Card>

        {/* Result Panel */}
        <div className="flex flex-col gap-4">
          {error && (
            <Card className="bg-red-50 border-red-200">
              <div className="flex items-start gap-3 text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Validation Error</p>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {result && (() => {
            const conf = result.confidence || 0;
            const confColor = conf > 85
              ? { card: 'bg-emerald-50/80 border-emerald-200 border-l-4 border-l-emerald-600', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', text: 'text-emerald-700', bar: 'bg-emerald-500', track: 'bg-emerald-100', label: 'High Confidence' }
              : conf >= 60
                ? { card: 'bg-amber-50/80 border-amber-200 border-l-4 border-l-amber-600', badge: 'bg-amber-100 text-amber-800 border-amber-300', text: 'text-amber-700', bar: 'bg-amber-500', track: 'bg-amber-100', label: 'Moderate Confidence' }
                : { card: 'bg-red-50/80 border-red-200 border-l-4 border-l-red-600', badge: 'bg-red-100 text-red-800 border-red-300', text: 'text-red-700', bar: 'bg-red-500', track: 'bg-red-100', label: 'Low Confidence (Less Certain)' };

            return (
              <Card className={`${confColor.card} flex-1 ai-result shadow-sm`}>
                <div className="text-center py-6">
                  <div className="flex justify-center mb-5">
                    <div className="bg-white border-4 border-gray-100 p-4 rounded-full shadow-md">
                      <CheckCircle className={`h-12 w-12 ${confColor.text}`} />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Recommended Crop {user?.district ? `for ${user.district}, ${user.state}` : ''}
                  </p>
                  <h2 className={`text-5xl font-black capitalize mb-3 ${confColor.text}`}>{result.crop}</h2>

                  {result.used_climate_normals && (
                    <div className="mb-4 inline-block px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-semibold">
                      Auto-substituted regional climate normals for {user?.state || 'your region'}
                    </div>
                  )}

                  {result.confidence && (
                    <div className="w-3/4 mx-auto space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-600">Model Confidence</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${confColor.badge}`}>
                          {confColor.label}: {result.confidence.toFixed(1)}%
                        </span>
                      </div>
                      <div className={`w-full ${confColor.track} rounded-full h-3 overflow-hidden`}>
                        <div
                          className={`${confColor.bar} h-3 rounded-full transition-all duration-700`}
                          style={{ width: `${Math.min(result.confidence, 100)}%` }}
                        />
                      </div>
                      {conf < 60 && (
                        <p className="text-[11px] font-medium text-red-700 text-left mt-1">
                          ⚠️ Note: Model confidence is low (&lt;60%). Consider re-verifying soil test inputs.
                        </p>
                      )}
                    </div>
                  )}

                  {result.fertilizer && (
                    <div className="mt-6 text-left px-5 py-4 bg-white rounded-xl border border-gray-200 shadow-xs space-y-3 mx-4">
                      <div>
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${confColor.bar}`} />
                          Suitable Fertilizer
                        </h4>
                        <p className="text-xs text-gray-700 mt-1 leading-relaxed">{result.fertilizer}</p>
                      </div>
                      <div className="border-t border-gray-100 pt-2" />
                      <div>
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Farming Tips
                        </h4>
                        <p className="text-xs text-gray-700 mt-1 leading-relaxed">{result.tips}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })()}

          {!result && !error && (
            <div className="flex-1 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 min-h-[300px] gap-3">
              <Sprout className="h-12 w-12 text-gray-200" />
              <p className="text-sm text-center px-4">
                Fill in mandatory soil parameters and click "Get Crop Recommendation" to see results here.
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Info className="h-3.5 w-3.5" />
                Environmental conditions default to your profile region's climate normals if left blank.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PAST SUBMISSIONS HISTORY PANEL */}
      <SubmissionHistory
        title="Past Crop Recommendations"
        records={historyRecords}
        loading={historyLoading}
        type="crop"
        onRefresh={fetchHistory}
      />
    </div>
  );
};

export default CropRecommendation;


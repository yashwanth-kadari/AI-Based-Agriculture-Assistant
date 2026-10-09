import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, TrendingUp, TrendingDown, IndianRupee, Sparkles, RefreshCw } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import SubmissionHistory from '../components/SubmissionHistory';
import API, { calculateFinancials, getFinancialHistory } from '../utils/api';


const FinancialPlanning = ({ user }) => {
  const [form, setForm] = useState({
    crop: 'rice',
    area: '1',
    seed_cost: '',
    fertilizer_cost: '',
    labor_cost: '',
    other_cost: '2000',
    price_per_kg: '',
    expected_yield_kg: '',
  });

  const [autofillMeta, setAutofillMeta] = useState({
    price_source: '',
    yield_source: '',
    isLoaded: false,
  });

  const [loading, setLoading] = useState(false);
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;
    setHistoryLoading(true);
    try {
      const { data } = await getFinancialHistory(user.id);
      setHistoryRecords(data?.history || []);
    } catch (err) {
      console.error('Error fetching financial history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const fetchAutofillData = useCallback(async (selectedCrop) => {
    setAutofillLoading(true);
    try {
      const res = await API.get(`/financial/autofill?crop=${selectedCrop}`);
      const data = res.data;
      if (data?.autofill) {
        setForm((prev) => ({
          ...prev,
          price_per_kg: prev.price_per_kg === '' || prev.crop !== selectedCrop ? String(data.autofill.price_per_kg) : prev.price_per_kg,
          expected_yield_kg: prev.expected_yield_kg === '' || prev.crop !== selectedCrop ? String(data.autofill.expected_yield_kg) : prev.expected_yield_kg,
          seed_cost: prev.seed_cost === '' ? String(data.defaults.seed_cost) : prev.seed_cost,
          fertilizer_cost: prev.fertilizer_cost === '' ? String(data.defaults.fertilizer_cost) : prev.fertilizer_cost,
          labor_cost: prev.labor_cost === '' ? String(data.defaults.labor_cost) : prev.labor_cost,
          other_cost: prev.other_cost === '' ? String(data.defaults.other_cost) : prev.other_cost,
        }));
        setAutofillMeta({
          price_source: data.autofill.price_source,
          yield_source: data.autofill.yield_source,
          isLoaded: true,
        });
      }
    } catch (err) {
      console.error('Error fetching autofill financial data:', err);
    } finally {
      setAutofillLoading(false);
    }
  }, []);

  // Fetch real market price & prediction yield default whenever crop changes
  useEffect(() => {
    fetchAutofillData(form.crop);
  }, [form.crop, fetchAutofillData]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = { ...form, user_id: user?.id };
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') delete payload[k];
      });
      const { data } = await calculateFinancials(payload);
      setResult(data);
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Calculation failed.');
    } finally {
      setLoading(false);
    }
  };


  const inputClass = 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-eco-500 focus:border-eco-500 bg-white';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="h-7 w-7 text-eco-600" />
            Financial Planning &amp; Cost Calculator
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Production cost calculator, net profit estimator, and market trend sell/store recommendations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchAutofillData(form.crop)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-eco-50 text-eco-700 border border-eco-200 hover:bg-eco-100 transition-colors self-start"
        >
          <Sparkles className="h-3.5 w-3.5 text-eco-600" />
          {autofillLoading ? 'Syncing...' : 'Sync Market & Yield Data'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Production Cost Calculator" icon={Wallet} subtitle="Mandatory crop & area inputs first, editable cost parameters below">
          <form onSubmit={handleCalculate} className="space-y-4">
            {/* MANDATORY CROP & AREA */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Crop *</label>
                <select name="crop" value={form.crop} onChange={handleChange} className={inputClass}>
                  <option value="rice">Rice</option>
                  <option value="wheat">Wheat</option>
                  <option value="maize">Maize</option>
                  <option value="cotton">Cotton</option>
                  <option value="sugarcane">Sugarcane</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Area (acres) *</label>
                <input type="number" step="any" min="0.1" name="area" required value={form.area} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* COST & PRICE INPUT FIELDS */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Cost &amp; Market Parameters
                </span>
                {autofillMeta.isLoaded && (
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Auto-synced
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Seed Cost (₹/acre)</label>
                  <input type="number" step="any" name="seed_cost" value={form.seed_cost} onChange={handleChange} placeholder="e.g. 3000" className={inputClass} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700">Fertilizer (₹/acre)</label>
                  <input type="number" step="any" name="fertilizer_cost" value={form.fertilizer_cost} onChange={handleChange} placeholder="e.g. 8000" className={inputClass} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700">Labor (₹/acre)</label>
                  <input type="number" step="any" name="labor_cost" value={form.labor_cost} onChange={handleChange} placeholder="e.g. 12000" className={inputClass} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700">Other Costs (₹/acre)</label>
                  <input type="number" step="any" name="other_cost" value={form.other_cost} onChange={handleChange} placeholder="e.g. 2000" className={inputClass} />
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-gray-700">Price (₹/kg)</label>
                    <span className="text-[9px] text-eco-600 font-bold">{autofillMeta.price_source}</span>
                  </div>
                  <input type="number" step="any" name="price_per_kg" value={form.price_per_kg} onChange={handleChange} placeholder="e.g. 25.5" className={inputClass} />
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-gray-700">Yield (kg/acre)</label>
                    <span className="text-[9px] text-eco-600 font-bold">{autofillMeta.yield_source}</span>
                  </div>
                  <input type="number" step="any" name="expected_yield_kg" value={form.expected_yield_kg} onChange={handleChange} placeholder="e.g. 2000" className={inputClass} />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full py-2.5 mt-2" isLoading={loading} icon={IndianRupee}>
              Calculate Net Profit &amp; Strategy
            </Button>
          </form>
        </Card>

        {/* RESULTS PANEL */}
        <div className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

          {result ? (() => {
            const isProfitable = result.profit > 0;
            const profitTheme = isProfitable
              ? { card: 'bg-emerald-50/90 border-emerald-300 border-l-4 border-l-emerald-600', text: 'text-emerald-700 font-black', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: 'text-emerald-600' }
              : { card: 'bg-red-50/90 border-red-300 border-l-4 border-l-red-600', text: 'text-red-700 font-black', badge: 'bg-red-100 text-red-800 border-red-300', icon: 'text-red-600' };

            const suggText = (result.sell_suggestion || '').toLowerCase();
            const suggTheme = suggText.includes('sell now')
              ? { card: 'bg-emerald-50/90 border-emerald-300 border-l-4 border-l-emerald-600 text-emerald-950', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
              : suggText.includes('store')
                ? { card: 'bg-amber-50/90 border-amber-300 border-l-4 border-l-amber-600 text-amber-950', badge: 'bg-amber-100 text-amber-800 border-amber-300' }
                : { card: 'bg-red-50/90 border-red-300 border-l-4 border-l-red-600 text-red-950', badge: 'bg-red-100 text-red-800 border-red-300' };

            return (
              <>
                <Card className={`${profitTheme.card} shadow-sm`} title="Expense &amp; Income Summary" icon={IndianRupee}>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between text-gray-700 font-medium">
                      <span>Seed Cost</span>
                      <span>₹{result.costs.seed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-700 font-medium">
                      <span>Fertilizer Cost</span>
                      <span>₹{result.costs.fertilizer.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-700 font-medium">
                      <span>Labor Cost</span>
                      <span>₹{result.costs.labor.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-700 font-medium">
                      <span>Other Operational Costs</span>
                      <span>₹{result.costs.other.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-gray-200/80 pt-2 flex justify-between font-bold text-gray-900">
                      <span>Total Production Cost</span>
                      <span className="text-red-700">₹{result.costs.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>Estimated Gross Revenue</span>
                      <span className="text-emerald-700">₹{result.income.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-200/80 pt-3">
                      <span className="font-extrabold text-sm text-gray-900">Net Estimated Profit / Loss</span>
                      <span className={`text-xl ${profitTheme.text}`}>
                        ₹{result.profit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        {isProfitable ? (
                          <TrendingUp className={`h-4 w-4 ${profitTheme.icon}`} />
                        ) : (
                          <TrendingDown className={`h-4 w-4 ${profitTheme.icon}`} />
                        )}
                        <span className="text-gray-800">Financial Outcome: {isProfitable ? 'Profitable Harvest' : 'Net Financial Loss'}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs border font-bold ${profitTheme.badge}`}>
                        Profit Margin: {result.profit_margin}%
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className={`${suggTheme.card} shadow-sm`} title="Market Strategy Recommendation" icon={Wallet}>
                  <div className="space-y-2">
                    <span className={`inline-block px-2.5 py-0.5 text-xs font-extrabold rounded-full border ${suggTheme.badge}`}>
                      Action Plan
                    </span>
                    <p className="text-xs text-gray-800 font-medium leading-relaxed">{result.sell_suggestion}</p>
                  </div>
                </Card>
              </>
            );
          })() : (
            <Card className="flex flex-col items-center justify-center text-gray-400 min-h-[300px] border-dashed border-2">
              <Wallet className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm text-center px-4">
                Fill in crop details and click "Calculate Net Profit" to view your financial breakdown and market strategy.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* PAST SUBMISSIONS HISTORY PANEL */}
      <SubmissionHistory
        title="Past Financial Planning Submissions"
        records={historyRecords}
        loading={historyLoading}
        type="financial"
        onRefresh={fetchHistory}
      />
    </div>
  );
};

export default FinancialPlanning;


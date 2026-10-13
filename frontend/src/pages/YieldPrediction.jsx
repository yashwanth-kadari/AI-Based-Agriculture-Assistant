import React, { useState, useEffect, useCallback } from 'react';
import {
  Tractor, AlertCircle, CheckCircle, Info, Sparkles, Sprout,
  FileText, FileCheck, ArrowLeft, PlusCircle, FlaskConical
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import SubmissionHistory from '../components/SubmissionHistory';
import { predictYield, getSoilReports, getYieldHistory } from '../utils/api';
import {
  FERTILITY_OPTIONS,
  FERTILIZER_USAGE_OPTIONS,
  SOIL_TYPE_OPTIONS,
  mapQualitativeToNumeric
} from '../utils/agronomyMapping';


const CROPS = [
  { value: 'rice', label: 'Rice' },
  { value: 'wheat', label: 'Wheat' },
  { value: 'maize', label: 'Maize' },
  { value: 'cotton', label: 'Cotton' },
  { value: 'sugarcane', label: 'Sugarcane' },
  { value: 'pulses', label: 'Pulses / Lentils' },
];

const IRRIGATION_TYPES = [
  { value: 'drip', label: 'Drip Irrigation' },
  { value: 'sprinkler', label: 'Sprinkler System' },
  { value: 'canal', label: 'Canal / Flood Irrigation' },
  { value: 'rainfed', label: 'Rainfed (Monsoon Dependent)' },
];

const FERTILIZER_OPTIONS = [
  { value: 'Standard NPK', label: 'Standard Balanced NPK' },
  { value: 'High Organic + NPK', label: 'High Organic + NPK Supplement' },
  { value: 'Organic Only', label: '100% Organic Compost' },
  { value: 'Low', label: 'Minimal / Low Fertilizer' },
];

const YieldPrediction = ({ user }) => {
  // Mode Selection: null (unselected), 'manual', or 'soil_report'
  const [inputMode, setInputMode] = useState(null);

  // Option 1 (Manual / Qualitative Input Form State)
  const [qualitativeData, setQualitativeData] = useState({
    crop_type: 'rice',
    area: '1',
    soilFertility: 'average',
    fertilizerUse: 'light',
    soilType: 'loamy',
    irrigation: 'canal',
    fertilizer_usage: 'Standard NPK',
    previous_yield: '',
  });

  // Option 2 (Soil Test Report Form State - Pre-filled & Fully Editable)
  const [soilFormData, setSoilFormData] = useState({
    N: '',
    P: '',
    K: '',
    ph: '',
    crop_type: 'rice',
    area: '1',
    irrigation: 'canal',
    fertilizer_usage: 'Standard NPK',
    previous_yield: '',
    temperature: '',
    humidity: '',
    rainfall: '',
  });

  const [soilReportDate, setSoilReportDate] = useState('');
  const [loadingSoilReport, setLoadingSoilReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const { data } = await getYieldHistory();
      setHistoryRecords(data?.history || []);
    } catch (err) {
      console.error('Error fetching yield history:', err);
    } finally {
      setHistoryLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const fetchLatestSoilReport = useCallback(async () => {
    if (!user) return;
    setLoadingSoilReport(true);
    try {
      const { data } = await getSoilReports();
      if (data?.reports && data.reports.length > 0) {
        const latest = data.reports[0];
        setSoilFormData({
          N: latest.n_content != null ? String(latest.n_content) : '',
          P: latest.p_content != null ? String(latest.p_content) : '',
          K: latest.k_content != null ? String(latest.k_content) : '',
          ph: latest.ph != null ? String(latest.ph) : '',
          crop_type: qualitativeData.crop_type,
          area: qualitativeData.area,
          irrigation: qualitativeData.irrigation,
          fertilizer_usage: qualitativeData.fertilizer_usage,
          previous_yield: qualitativeData.previous_yield,
          temperature: latest.temperature != null ? String(latest.temperature) : '',
          humidity: latest.humidity != null ? String(latest.humidity) : '',
          rainfall: latest.rainfall != null ? String(latest.rainfall) : '',
        });
        if (latest.created_at) {
          setSoilReportDate(new Date(latest.created_at).toLocaleDateString());
        }
      }
    } catch (err) {
      console.error('Error fetching soil report for pre-fill:', err);
    } finally {
      setLoadingSoilReport(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, qualitativeData.crop_type, qualitativeData.area, qualitativeData.irrigation, qualitativeData.fertilizer_usage, qualitativeData.previous_yield]);

  // Auto-fetch latest soil report when Option 2 mode is activated
  useEffect(() => {
    if (inputMode === 'soil_report') {
      fetchLatestSoilReport();
    }
  }, [inputMode, fetchLatestSoilReport]);

  const handleQualitativeChange = (e) => {
    setQualitativeData({ ...qualitativeData, [e.target.name]: e.target.value });
  };

  const handleSoilFormChange = (e) => {
    setSoilFormData({ ...soilFormData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let nVal, pVal, kVal, phVal, cropVal, areaVal, tempVal, humVal, rainVal, irrVal, fertVal, prevYieldVal;
    let isEstimated = false;

    if (inputMode === 'soil_report') {
      if (!soilFormData.N || !soilFormData.P || !soilFormData.K || !soilFormData.ph) {
        setError('Please provide mandatory N, P, K and pH soil test parameters.');
        return;
      }
      const areaNum = parseFloat(soilFormData.area);
      if (isNaN(areaNum) || areaNum <= 0) {
        setError('Farm area must be greater than 0 acres.');
        return;
      }
      nVal = soilFormData.N;
      pVal = soilFormData.P;
      kVal = soilFormData.K;
      phVal = soilFormData.ph;
      cropVal = soilFormData.crop_type;
      areaVal = areaNum;
      irrVal = soilFormData.irrigation;
      fertVal = soilFormData.fertilizer_usage;
      prevYieldVal = soilFormData.previous_yield;
      tempVal = soilFormData.temperature;
      humVal = soilFormData.humidity;
      rainVal = soilFormData.rainfall;
      isEstimated = false;
    } else {
      const areaNum = parseFloat(qualitativeData.area);
      if (isNaN(areaNum) || areaNum <= 0) {
        setError('Farm area must be greater than 0 acres.');
        return;
      }
      // Option 1: Qualitative mapping
      const mapped = mapQualitativeToNumeric({
        soilFertility: qualitativeData.soilFertility,
        fertilizerUse: qualitativeData.fertilizerUse,
        soilType: qualitativeData.soilType,
      });

      nVal = mapped.N;
      pVal = mapped.P;
      kVal = mapped.K;
      phVal = mapped.ph;
      cropVal = qualitativeData.crop_type;
      areaVal = areaNum;
      irrVal = qualitativeData.irrigation;
      fertVal = qualitativeData.fertilizer_usage;
      prevYieldVal = qualitativeData.previous_yield;
      // Environmental conditions NOT included from Option 1 form (silently auto-filled by backend)
      tempVal = undefined;
      humVal = undefined;
      rainVal = undefined;
      isEstimated = true;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const locationLabel = user?.district && user?.state ? `${user.district}, ${user.state}` : 'Farm Location';
      const payload = {
        crop_type: cropVal,
        area: areaVal,
        irrigation: irrVal,
        fertilizer_usage: fertVal,
        previous_yield: prevYieldVal || undefined,
        N: nVal,
        P: pVal,
        K: kVal,
        ph: phVal,
        temperature: tempVal || undefined,
        humidity: humVal || undefined,
        rainfall: rainVal || undefined,
        location: locationLabel,
        state: user?.state,
        is_estimated: isEstimated,
      };

      const { data } = await predictYield(payload);

      const baseYieldPerAcre = data.yield_category === 'High' ? 2200 : (data.yield_category === 'Medium' ? 1600 : 900);
      const totalYieldKg = Math.round(baseYieldPerAcre * areaVal);

      setResult({
        ...data,
        expected_yield: `${totalYieldKg.toLocaleString()} kg`,
        kg_per_acre: baseYieldPerAcre,
        area_acres: areaVal,
        is_estimated: isEstimated,
      });
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Yield prediction failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const baseInput = 'mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-eco-500 focus:border-eco-500 text-sm bg-white';

  const inputClass = (field, val) => {
    const isMandatory = ['N', 'P', 'K', 'ph'].includes(field);
    const missing = error && isMandatory && (val === '' || val == null);
    return `mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-eco-500 text-sm bg-white ${missing ? 'border-red-400 focus:border-red-400 focus:ring-red-300' : 'border-gray-200 focus:border-eco-500'
      }`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tractor className="h-7 w-7 text-eco-600" />
            Crop Yield Estimator
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Estimate expected harvest yield based on farm area, crop type, observation-based soil fertility, or saved soil health reports.
          </p>
        </div>

        {inputMode && (
          <button
            type="button"
            onClick={() => {
              setInputMode(null);
              setResult(null);
              setError('');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors self-start sm:self-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Change Input Method
          </button>
        )}
      </div>

      {/* MODE SELECTION SCREEN (Shown when inputMode === null) */}
      {!inputMode && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              How would you like to provide your farm information?
            </h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Select one of the two input options below to configure yield estimation inputs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-left">
              {/* Option 1 Card */}
              <button
                type="button"
                onClick={() => {
                  setInputMode('manual');
                  setResult(null);
                  setError('');
                }}
                className="group p-6 rounded-2xl border-2 border-gray-200 hover:border-eco-500 hover:bg-eco-50/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-eco-500 text-left flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-eco-100 text-eco-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-eco-800">
                    1 — Manual Farm / Management Input
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    No lab test required! Answer simple questions about your farm area, crop vigor, and fertilizer practices.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-eco-600">
                  <span>Select Simple Questions Mode</span>
                  <span>&rarr;</span>
                </div>
              </button>

              {/* Option 2 Card */}
              <button
                type="button"
                onClick={() => {
                  setInputMode('soil_report');
                  setResult(null);
                  setError('');
                }}
                className="group p-6 rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <FileCheck className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-800">
                    2 — Use Soil Test Report
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Uses exact N, P, K, pH values auto-filled from your saved Soil Health report (fully editable).
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                  <span>Use Saved Soil Report</span>
                  <span>&rarr;</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORM AND RESULTS CONTAINER (Shown when inputMode !== null) */}
      {inputMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT COLUMN: SELECTED INPUT MODE FORM */}
          <div>
            {/* OPTION 1: SIMPLIFIED & REORDERED MANUAL INPUT FORM */}
            {inputMode === 'manual' && (
              <Card
                title="Field Observation Input (No Soil Test Needed)"
                icon={FileText}
                subtitle="Mandatory farm &amp; soil inputs listed first, optional practices below"
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* MANDATORY FIELDS SECTION (TOP) */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sprout className="h-4 w-4 text-eco-600" />
                      Mandatory Crop &amp; Soil Inputs
                    </p>

                    {/* 1. Crop Type & Farm Area Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700">
                          Crop Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="crop_type"
                          required
                          value={qualitativeData.crop_type}
                          onChange={handleQualitativeChange}
                          className={baseInput}
                        >
                          {CROPS.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700">
                          Farm Area (acres) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          name="area"
                          required
                          value={qualitativeData.area}
                          onChange={handleQualitativeChange}
                          placeholder="e.g. 2.5"
                          className={baseInput}
                        />
                      </div>
                    </div>

                    {/* 2. Soil Fertility Status */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700">
                        Soil Fertility Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="soilFertility"
                        required
                        value={qualitativeData.soilFertility}
                        onChange={handleQualitativeChange}
                        className={baseInput}
                      >
                        {FERTILITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        How vigorously do crops normally grow in this field?
                      </p>
                    </div>

                    {/* 3. Recent Fertilizer Application */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700">
                        Recent Fertilizer Application <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="fertilizerUse"
                        required
                        value={qualitativeData.fertilizerUse}
                        onChange={handleQualitativeChange}
                        className={baseInput}
                      >
                        {FERTILIZER_USAGE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* 4. Soil Type */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700">
                        Soil Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="soilType"
                        required
                        value={qualitativeData.soilType}
                        onChange={handleQualitativeChange}
                        className={baseInput}
                      >
                        {SOIL_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Selecting "Not Sure" uses a safe neutral default (pH 6.5).
                      </p>
                    </div>
                  </div>

                  {/* OPTIONAL MANAGEMENT INPUTS SECTION (BELOW) */}
                  <div className="pt-3 border-t border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Optional Management Practices
                      </span>
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                        Optional
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700">
                          Irrigation Source <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <select
                          name="irrigation"
                          value={qualitativeData.irrigation}
                          onChange={handleQualitativeChange}
                          className={baseInput}
                        >
                          {IRRIGATION_TYPES.map((i) => (
                            <option key={i.value} value={i.value}>{i.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700">
                          Fertilizer Practice <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <select
                          name="fertilizer_usage"
                          value={qualitativeData.fertilizer_usage}
                          onChange={handleQualitativeChange}
                          className={baseInput}
                        >
                          {FERTILIZER_OPTIONS.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700">
                        Prev. Yield (kg/acre) <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="previous_yield"
                        value={qualitativeData.previous_yield}
                        onChange={handleQualitativeChange}
                        placeholder="Your last season yield"
                        className={baseInput}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full py-2.5 mt-2" isLoading={loading} icon={Tractor}>
                    Predict Total Yield
                  </Button>
                </form>
              </Card>
            )}

            {/* OPTION 2: EDITABLE SOIL TEST REPORT FORM (MATCHES CROP RECOMMENDATION PATTERN) */}
            {inputMode === 'soil_report' && (
              <Card
                title="Soil Test Parameters"
                icon={FlaskConical}
                subtitle="Pre-filled from your latest soil test report (fully editable)"
              >
                {loadingSoilReport ? (
                  <div className="py-12 text-center text-gray-500 text-sm">
                    <div className="w-6 h-6 border-2 border-eco-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading soil test parameters...
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Header Label / Auto-fill Sync Status */}
                    <div className="flex items-center justify-between bg-eco-50 border border-eco-200 px-3 py-2 rounded-lg text-xs">
                      <span className="font-semibold text-eco-800 flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-eco-600" />
                        {soilReportDate ? `Auto-filled from soil test on ${soilReportDate}` : 'Synced with Soil Health'}
                      </span>
                      <span className="text-[11px] font-bold text-eco-700 bg-white px-2 py-0.5 rounded border border-eco-200">
                        Editable
                      </span>
                    </div>

                    {/* MANDATORY SOIL TEST VALUES (TOP) */}
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
                          value={soilFormData.N}
                          onChange={handleSoilFormChange}
                          placeholder="e.g. 80"
                          className={inputClass('N', soilFormData.N)}
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
                          value={soilFormData.P}
                          onChange={handleSoilFormChange}
                          placeholder="e.g. 40"
                          className={inputClass('P', soilFormData.P)}
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
                          value={soilFormData.K}
                          onChange={handleSoilFormChange}
                          placeholder="e.g. 30"
                          className={inputClass('K', soilFormData.K)}
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
                        value={soilFormData.ph}
                        onChange={handleSoilFormChange}
                        placeholder="Target range: 5.5 - 7.5"
                        className={inputClass('ph', soilFormData.ph)}
                      />
                    </div>

                    {/* PAGE CONTEXT: CROP TYPE & FARM AREA */}
                    <div className="pt-2 border-t border-gray-100 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700">
                            Crop Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="crop_type"
                            required
                            value={soilFormData.crop_type}
                            onChange={handleSoilFormChange}
                            className={baseInput}
                          >
                            {CROPS.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700">
                            Farm Area (acres) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            name="area"
                            required
                            value={soilFormData.area}
                            onChange={handleSoilFormChange}
                            placeholder="e.g. 2.5"
                            className={baseInput}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700">
                            Irrigation Source <span className="text-gray-400 font-normal">(optional)</span>
                          </label>
                          <select
                            name="irrigation"
                            value={soilFormData.irrigation}
                            onChange={handleSoilFormChange}
                            className={baseInput}
                          >
                            {IRRIGATION_TYPES.map((i) => (
                              <option key={i.value} value={i.value}>{i.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700">
                            Fertilizer Practice <span className="text-gray-400 font-normal">(optional)</span>
                          </label>
                          <select
                            name="fertilizer_usage"
                            value={soilFormData.fertilizer_usage}
                            onChange={handleSoilFormChange}
                            className={baseInput}
                          >
                            {FERTILIZER_OPTIONS.map((f) => (
                              <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* ENVIRONMENTAL CONDITIONS — OPTIONAL (BELOW) */}
                    <div className="pt-3 border-t border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Environmental Conditions — Optional
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
                            value={soilFormData.temperature}
                            onChange={handleSoilFormChange}
                            placeholder="e.g. 25"
                            className={baseInput}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-gray-500">Humidity (%)</label>
                          <input
                            type="number"
                            step="any"
                            name="humidity"
                            value={soilFormData.humidity}
                            onChange={handleSoilFormChange}
                            placeholder="e.g. 65"
                            className={baseInput}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-gray-500">Rainfall (mm)</label>
                          <input
                            type="number"
                            step="any"
                            name="rainfall"
                            value={soilFormData.rainfall}
                            onChange={handleSoilFormChange}
                            placeholder="e.g. 120"
                            className={baseInput}
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full py-2.5 mt-2" isLoading={loading} icon={Tractor}>
                      Predict Total Yield (with Soil Report Values)
                    </Button>
                  </form>
                )}
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN: OUTPUT RESULTS */}
          <div>
            {error && (
              <Card className="bg-red-50 border-red-200 mb-4">
                <div className="flex items-start text-red-700 gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Validation Error</p>
                    <p className="text-xs mt-1">{error}</p>
                  </div>
                </div>
              </Card>
            )}

            {result ? (() => {
              const level = (result.yield_category || result.yield_level || 'Medium').toString();
              const isHigh = level.toLowerCase().includes('high');
              const isLow = level.toLowerCase().includes('low');
              const theme = isHigh
                ? { card: 'bg-emerald-50/90 border-emerald-300 border-l-4 border-l-emerald-600', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', num: 'text-emerald-700', bar: 'bg-emerald-500', track: 'bg-emerald-100' }
                : isLow
                  ? { card: 'bg-red-50/90 border-red-300 border-l-4 border-l-red-600', badge: 'bg-red-100 text-red-800 border-red-300', num: 'text-red-700', bar: 'bg-red-500', track: 'bg-red-100' }
                  : { card: 'bg-amber-50/90 border-amber-300 border-l-4 border-l-amber-600', badge: 'bg-amber-100 text-amber-800 border-amber-300', num: 'text-amber-700', bar: 'bg-amber-500', track: 'bg-amber-100' };

              return (
                <Card className={`${theme.card} flex flex-col justify-between p-6 min-h-[320px] shadow-sm space-y-4`}>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${theme.badge}`}>
                        {result.is_estimated ? 'Estimated Yield Rating' : 'Lab-Verified Yield Rating'}: {result.yield_level || level}
                      </span>
                      <span className="text-xs font-bold text-gray-600">
                        Model Confidence: {result.confidence?.toFixed(1)}%
                      </span>
                    </div>

                    <div className="text-center py-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {result.is_estimated ? 'Estimated Harvest Output' : 'Predicted Total Output'}
                      </p>
                      <h2 className={`text-4xl font-black mt-1 ${theme.num}`}>{result.expected_yield}</h2>
                      <p className="text-xs font-medium text-gray-600 mt-1">
                        (~{result.kg_per_acre} kg per acre across {result.area_acres} acre{result.area_acres > 1 ? 's' : ''})
                      </p>
                    </div>

                    <p className="text-xs text-gray-700 bg-white/90 p-3 rounded-lg border border-gray-200 mt-2 leading-relaxed">
                      {result.message}
                    </p>

                    {result.recommendations && result.recommendations.length > 0 && (
                      <div className="mt-4 space-y-1.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-800">
                          Optimization Advice:
                        </p>
                        {result.recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-xs text-gray-700">
                            <Sparkles className={`h-3.5 w-3.5 ${theme.num} flex-shrink-0 mt-0.5`} />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* TRANSPARENCY DISCLOSURE NOTE FOR OPTION 1 */}
                  {result.is_estimated && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2 text-amber-900 text-xs mt-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Estimation Note:</span> Based on your qualitative soil fertility description, not a lab-tested value — for a precise recommendation, get a soil test done via the Soil Health tool.
                      </div>
                    </div>
                  )}

                  <div className={`w-full ${theme.track} rounded-full h-2.5 mt-2 overflow-hidden`}>
                    <div
                      className={`${theme.bar} h-2.5 rounded-full transition-all duration-700`}
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                </Card>
              );
            })() : (
              <Card className="flex flex-col items-center justify-center text-gray-400 min-h-[300px] border-dashed border-2">
                <Tractor className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm text-center px-4">
                  Select an input method, answer simple questions or load a soil report, and click "Predict Total Yield" to view results.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* PAST SUBMISSIONS HISTORY PANEL */}
      <SubmissionHistory
        title="Past Yield Predictions"
        records={historyRecords}
        loading={historyLoading}
        type="yield"
        onRefresh={fetchHistory}
      />
    </div>
  );
};

export default YieldPrediction;


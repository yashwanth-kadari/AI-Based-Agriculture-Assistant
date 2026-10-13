import React, { useState, useEffect, useCallback } from 'react';
import { Leaf, Info, Percent, ShieldCheck, HelpCircle, Droplet, Sun, Wind, Sprout } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import SubmissionHistory from '../components/SubmissionHistory';
import { getSustainabilityPractices, submitSustainabilityAudit, getSustainabilityHistory } from '../utils/api';

const Sustainability = ({ user }) => {
    // Configured inputs
    const [waterHours, setWaterHours] = useState('4');
    const [fertilizerType, setFertilizerType] = useState('Mixed');
    const [cropRotation, setCropRotation] = useState('Occasional');
    const [tillageType, setTillageType] = useState('Reduced');
    const [solarEnergy, setSolarEnergy] = useState(false);
    const [crop, setCrop] = useState('Rice');

    // Result state
    const [auditResult, setAuditResult] = useState(null);
    const [auditLoading, setAuditLoading] = useState(false);
    const [historyRecords, setHistoryRecords] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Guidelines state
    const [practices, setPractices] = useState([]);
    const [rotations, setRotations] = useState({});
    const [configLoading, setConfigLoading] = useState(true);

    const fetchConfig = useCallback(async () => {
        try {
            const { data } = await getSustainabilityPractices();
            setPractices(data.practices || []);
            setRotations(data.rotations || {});
        } catch (err) {
            console.error(err);
        } finally {
            setConfigLoading(false);
        }
    }, []);

    const fetchHistory = useCallback(async () => {
        if (!user) return;
        setHistoryLoading(true);
        try {
            const { data } = await getSustainabilityHistory();
            setHistoryRecords(data?.history || []);
        } catch (err) {
            console.error('Error fetching sustainability history:', err);
        } finally {
            setHistoryLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    useEffect(() => {
        fetchConfig();
        fetchHistory();
    }, [fetchConfig, fetchHistory]);

    const handleAudit = async (e) => {
        e.preventDefault();
        setAuditLoading(true);
        try {
            const { data } = await submitSustainabilityAudit({
                water_hours: waterHours,
                fertilizer_type: fertilizerType,
                crop_rotation: cropRotation,
                tillage_type: tillageType,
                solar_energy: solarEnergy,
                crop: crop,
            });
            setAuditResult(data);
            fetchHistory();
        } catch (err) {
            console.error(err);
        } finally {
            setAuditLoading(false);
        }
    };


    const getBreakdownLabel = (val) => {
        if (val >= 80) return 'text-green-600 font-bold';
        if (val >= 60) return 'text-orange-500 font-bold';
        return 'text-red-500 font-bold';
    };

    const baseInput = 'mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-eco-500 text-sm bg-white';

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="page-header">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Leaf className="h-7 w-7 text-eco-600" />
                    Regenerative &amp; Sustainability Index
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    Audit your farm's eco-footprint score across 5 regenerative factors: water, soil inputs, crop rotation, tillage, and green energy.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column: Audit Input */}
                <Card title="Regenerative Farm Audit" icon={Leaf}>
                    <form onSubmit={handleAudit} className="space-y-4">
                        {/* MANDATORY FARM PRACTICES SECTION */}
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Sprout className="h-4 w-4 text-eco-600" />
                                Mandatory Farm Practices
                            </p>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700">Crop Selection *</label>
                                <select
                                    value={crop}
                                    onChange={(e) => setCrop(e.target.value)}
                                    className={baseInput}
                                >
                                    <option value="Rice">Rice (Water Intensive)</option>
                                    <option value="Wheat">Wheat (Moderate Water)</option>
                                    <option value="Maize">Maize (Low-Moderate Water)</option>
                                    <option value="Cotton">Cotton (Deep Taproot)</option>
                                    <option value="Sugarcane">Sugarcane (Multi-Year Ratoon)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700">Irrigation Scheduling *</label>
                                <select
                                    value={waterHours}
                                    onChange={(e) => setWaterHours(e.target.value)}
                                    className={baseInput}
                                >
                                    <option value="2">Low (Sprinklers / Drip, ~2 hrs/day)</option>
                                    <option value="4">Moderate (Regular scheduled, ~4 hrs/day)</option>
                                    <option value="8">High (Heavy flood irrigation, ~8 hrs/day)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700">Primary Fertilizer Type *</label>
                                <select
                                    value={fertilizerType}
                                    onChange={(e) => setFertilizerType(e.target.value)}
                                    className={baseInput}
                                >
                                    <option value="Chemical">Synthetic Chemical (Urea / DAP)</option>
                                    <option value="Mixed">Mixed (Chemical + Organic Composts)</option>
                                    <option value="Organic">100% Organic Manure &amp; Vermicompost</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700">Crop Rotation Frequency *</label>
                                <select
                                    value={cropRotation}
                                    onChange={(e) => setCropRotation(e.target.value)}
                                    className={baseInput}
                                >
                                    <option value="Regular">Regular Annual Rotation (with Legumes / Pulses)</option>
                                    <option value="Occasional">Occasional Rotation (Every 2-3 years)</option>
                                    <option value="None">None / Monoculture (Same crop every year)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700">Tillage Practice *</label>
                                <select
                                    value={tillageType}
                                    onChange={(e) => setTillageType(e.target.value)}
                                    className={baseInput}
                                >
                                    <option value="Zero-Till">Zero-Till / No-Till Farming (Preserves Soil Structure)</option>
                                    <option value="Reduced">Reduced / Minimum Tillage</option>
                                    <option value="Conventional">Conventional Heavy Tillage (Deep Plowing)</option>
                                </select>
                            </div>
                        </div>

                        {/* OPTIONAL RENEWABLE ENERGY SECTION */}
                        <div className="pt-3 border-t border-gray-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                                    Renewable Infrastructure
                                </span>
                                <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                                    Optional
                                </span>
                            </div>

                            <div className="flex items-center gap-3 pt-1">
                                <input
                                    type="checkbox"
                                    id="solar"
                                    checked={solarEnergy}
                                    onChange={(e) => setSolarEnergy(e.target.checked)}
                                    className="h-4 w-4 text-eco-600 focus:ring-eco-500 border-gray-300 rounded"
                                />
                                <label htmlFor="solar" className="text-xs font-semibold text-gray-700 select-none">
                                    Deploy Solar Energy / Renewable Pumps
                                </label>
                            </div>
                        </div>

                        <Button type="submit" isLoading={auditLoading} icon={Leaf} className="w-full py-2.5">
                            Calculate Sustainability Index
                        </Button>
                    </form>
                </Card>

                {/* Middle column: Audit Results */}
                <div className="lg:col-span-2 flex flex-col">
                    {auditResult ? (() => {
                        const score = auditResult.score || 0;
                        const label = (auditResult.label || '').toLowerCase();
                        const isGreen = score >= 75 || label.includes('leader') || label.includes('sustainable');
                        const isAmber = (score >= 55 && score < 75) || label.includes('transitioning');
                        const theme = isGreen
                            ? { card: 'bg-emerald-50/90 border-emerald-300 border-l-4 border-l-emerald-600', circle: 'bg-emerald-50 border-emerald-500 text-emerald-700', text: 'text-emerald-950 font-black', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
                            : isAmber
                                ? { card: 'bg-amber-50/90 border-amber-300 border-l-4 border-l-amber-600', circle: 'bg-amber-50 border-amber-500 text-amber-700', text: 'text-amber-950 font-black', badge: 'bg-amber-100 text-amber-800 border-amber-300' }
                                : { card: 'bg-red-50/90 border-red-300 border-l-4 border-l-red-600', circle: 'bg-red-50 border-red-500 text-red-700', text: 'text-red-950 font-black', badge: 'bg-red-100 text-red-800 border-red-300' };

                        return (
                            <Card className={`${theme.card} shadow-sm h-full`} title="Regenerative Index Scorecard" icon={Leaf}>
                                <div className="space-y-6">
                                    {/* Score circular visual */}
                                    <div className="flex items-center gap-6">
                                        <div className={`relative w-28 h-28 border-4 rounded-full flex flex-col items-center justify-center shadow-xs ${theme.circle}`}>
                                            <span className="text-[10px] uppercase font-extrabold tracking-wider">Score</span>
                                            <span className="text-3xl font-black">{auditResult.score}</span>
                                            <span className="text-[11px] font-bold text-gray-500">Grade: {auditResult.grade}</span>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sustainability Tier</p>
                                            <h3 className={`text-xl ${theme.text}`}>{auditResult.label}</h3>
                                            <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full border ${theme.badge}`}>
                                                Evaluated Crop: {auditResult.crop}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 5 Factor Breakdown */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-b border-gray-100 py-4">
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>Water Efficiency</span>
                                                <span className={getBreakdownLabel(auditResult.breakdown.water)}>
                                                    {auditResult.breakdown.water}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full">
                                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${auditResult.breakdown.water}%` }} />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>Fertilizer Impact</span>
                                                <span className={getBreakdownLabel(auditResult.breakdown.fertilizer)}>
                                                    {auditResult.breakdown.fertilizer}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full">
                                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${auditResult.breakdown.fertilizer}%` }} />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>Crop Rotation</span>
                                                <span className={getBreakdownLabel(auditResult.breakdown.rotation)}>
                                                    {auditResult.breakdown.rotation}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full">
                                                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${auditResult.breakdown.rotation}%` }} />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>Soil Tillage</span>
                                                <span className={getBreakdownLabel(auditResult.breakdown.tillage)}>
                                                    {auditResult.breakdown.tillage}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full">
                                                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${auditResult.breakdown.tillage}%` }} />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>Green Energy</span>
                                                <span className={getBreakdownLabel(auditResult.breakdown.energy)}>
                                                    {auditResult.breakdown.energy}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full">
                                                <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${auditResult.breakdown.energy}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Audit Tips */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-gray-900">Custom Recommendations:</h4>
                                        <ul className="space-y-1.5">
                                            {auditResult.tips.map((tip, idx) => (
                                                <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                                                    <span className="text-eco-500 font-bold mt-0.5">•</span>
                                                    <span>{tip}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </Card>
                        );
                    })() : (
                        <Card title="Regenerative Index Scorecard" icon={Leaf} className="h-full">
                            <div className="flex flex-col items-center justify-center text-gray-400 p-8 min-h-[320px] border-2 border-dashed border-gray-200 rounded-xl">
                                <Leaf className="h-10 w-10 text-gray-300 mb-3" />
                                <h3 className="text-sm font-bold text-gray-700">Calculate Sustainability Status</h3>
                                <p className="text-xs text-gray-500 text-center max-w-sm mt-1">
                                    Fill in mandatory farm practices and click "Calculate Sustainability Index" to evaluate your score across all 5 regenerative factors.
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Rotation Schemes & Regenerative guidelines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Recommended Crop Rotation Plan" icon={ShieldCheck}>
                    {configLoading ? (
                        <div className="flex justify-center py-6">
                            <div className="loading-ring" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(rotations).map(([base, details]) => {
                                const isSelectedCrop = base.toLowerCase() === crop.toLowerCase();
                                return (
                                    <div
                                        key={base}
                                        className={`p-3.5 rounded-xl border transition-all ${isSelectedCrop
                                            ? 'bg-eco-50/80 border-eco-300 ring-2 ring-eco-400'
                                            : 'bg-gray-50 border-gray-100'
                                            } space-y-1.5`}
                                    >
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-xs font-bold text-gray-950 flex items-center gap-1.5">
                                                {isSelectedCrop && <span className="px-1.5 py-0.5 text-[9px] bg-eco-600 text-white font-extrabold rounded">YOUR CROP</span>}
                                                If Current Crop is: {base}
                                            </span>
                                            <span className="text-[10px] font-bold text-eco-700 bg-white px-2 py-0.5 rounded border border-eco-200">
                                                Rotate With → {details.next_crop}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed font-medium">{details.reason}</p>
                                        <div className="text-[10px] text-blue-600 flex items-center gap-1 font-semibold">
                                            <Droplet className="h-3 w-3" />
                                            <span>{details.water_impact}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>

                <Card title="Regenerative Practice Guidelines" icon={Leaf}>
                    {configLoading ? (
                        <div className="flex justify-center py-6">
                            <div className="loading-ring" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {practices.map((pr) => (
                                <div key={pr.id} className="flex gap-3">
                                    <div className="p-2 h-8 w-8 bg-eco-50 rounded-lg flex items-center justify-center flex-shrink-0 text-eco-600 font-bold text-xs">
                                        {pr.id}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs font-bold text-gray-900">{pr.title}</h4>
                                            <span className="badge bg-gray-100 text-gray-600 text-[9px] font-semibold">{pr.difficulty}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{pr.benefit}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* PAST SUBMISSIONS HISTORY PANEL */}
            <SubmissionHistory
                title="Past Sustainability Assessments"
                records={historyRecords}
                loading={historyLoading}
                type="sustainability"
                onRefresh={fetchHistory}
            />
        </div>
    );
};

export default Sustainability;


import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  User,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  getExpertConsultations,
  submitExpertConsultation,
  replyExpertConsultation,
  deleteExpertConsultation
} from '../utils/api';

const CROPS_LIST = [
  'Rice',
  'Wheat',
  'Cotton',
  'Maize',
  'Sugarcane',
  'Tomato',
  'Potato',
  'Soybean',
  'Groundnut',
  'Mustard',
  'Pulses / Gram',
  'Other'
];

const TOPICS_LIST = [
  'Pest & Insect Infestation',
  'Fungal / Bacterial Disease',
  'Soil Nutrient & Fertilizer Plan',
  'Irrigation & Water Stress',
  'Seed Variety & Germination',
  'Harvest & Post-Harvest Care',
  'Organic Farming Conversion'
];

const ExpertAdvice = () => {
  const [consultations, setConsultations] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form State
  const [cropName, setCropName] = useState('Rice');
  const [topic, setTopic] = useState('Pest & Insect Infestation');
  const [urgency, setUrgency] = useState('Normal');
  const [question, setQuestion] = useState('');

  // Admin reply states
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchConsultations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getExpertConsultations();
      setConsultations(res.data.consultations || []);
      setIsAdmin(Boolean(res.data.is_admin));
    } catch (err) {
      console.error('Fetch consultations error:', err);
      setError(err?.response?.data?.error || 'Failed to load consultations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cropName || !topic || !question.trim()) {
      setError('Please provide crop, topic, and detailed question description.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await submitExpertConsultation({
        crop_name: cropName,
        topic,
        question: question.trim(),
        urgency
      });

      setSuccessMsg('Your inquiry has been submitted! An agronomist will review and reply.');
      setQuestion('');
      if (res.data?.consultation) {
        setConsultations((prev) => [res.data.consultation, ...prev]);
      } else {
        fetchConsultations();
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to submit inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostReply = async (consultationId) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const res = await replyExpertConsultation(consultationId, {
        expert_reply: replyText.trim()
      });
      setConsultations((prev) =>
        prev.map((c) => (c.id === consultationId ? res.data.consultation : c))
      );
      setActiveReplyId(null);
      setReplyText('');
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to post reply.');
    } finally {
      setReplying(false);
    }
  };

  const handleDelete = async (consultationId) => {
    if (!window.confirm('Are you sure you want to delete this consultation?')) return;
    try {
      await deleteExpertConsultation(consultationId);
      setConsultations((prev) => prev.filter((c) => c.id !== consultationId));
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to delete consultation.');
    }
  };

  const filteredConsultations = consultations.filter((c) => {
    if (statusFilter === 'All') return true;
    return c.status === statusFilter;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-green-800 to-teal-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold backdrop-blur-sm border border-emerald-400/30">
            <Sparkles size={14} className="text-amber-300" />
            Agronomist Advisory Desk
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Direct Agricultural Expert Consultations
          </h1>
          <p className="text-emerald-100 text-sm md:text-base leading-relaxed">
            Connect directly with verified agronomists, soil scientists, and plant pathologists for specialized diagnosis and personalized farming advisories.
          </p>
        </div>
      </div>

      {/* Main Layout: Left Form, Right Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Inquiry Submission Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-emerald-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                <HelpCircle size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Ask an Agronomy Specialist</h2>
                <p className="text-xs text-gray-500">Provide field specifics for accurate diagnosis</p>
              </div>
            </div>

            {successMsg && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Affected Crop
                </label>
                <select
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                >
                  {CROPS_LIST.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Advisory Category
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                >
                  {TOPICS_LIST.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Urgency Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['Low', 'Normal', 'High', 'Urgent'].map((lvl) => {
                    const active = urgency === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setUrgency(lvl)}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                          active
                            ? lvl === 'Urgent'
                              ? 'bg-red-600 text-white border-red-600 shadow-sm'
                              : lvl === 'High'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                              : 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Question & Field Symptoms
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={5}
                  placeholder="Describe crop growth stage, leaf discoloration, pest sightings, or soil conditions..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all placeholder:text-gray-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <span>Transmitting...</span>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Submit Inquiry</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Consultations History & Responses */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-emerald-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {isAdmin ? 'Platform Inquiries (Admin View)' : 'My Consultations & Advisories'}
                </h2>
                <p className="text-xs text-gray-500">
                  Track agronomist guidance and pending recommendations
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex p-1 bg-gray-100 rounded-xl text-xs font-semibold text-gray-600">
                {['All', 'Pending', 'Answered'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      statusFilter === f
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'hover:text-gray-900'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-5 border border-gray-100 rounded-xl bg-gray-50 animate-pulse h-32" />
                ))}
              </div>
            ) : filteredConsultations.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                <MessageSquare size={44} className="mx-auto text-gray-300 mb-3" />
                <h3 className="text-sm font-bold text-gray-700">No Consultations Found</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  {statusFilter === 'All'
                    ? 'Submit an inquiry on the left to receive guidance from certified agricultural experts.'
                    : `No inquiries with status "${statusFilter}".`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredConsultations.map((c) => {
                  const isAnswered = c.status === 'Answered';
                  const isUrgent = c.urgency === 'Urgent';
                  const isHigh = c.urgency === 'High';

                  return (
                    <div
                      key={c.id}
                      className="border border-gray-200/80 rounded-2xl p-5 hover:border-emerald-200 transition-all bg-white shadow-sm space-y-4"
                    >
                      {/* Inquiry Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg">
                            {c.crop_name}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            • {c.topic}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                              isUrgent
                                ? 'bg-red-100 text-red-800'
                                : isHigh
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {c.urgency} Urgency
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isAnswered ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                              <CheckCircle2 size={13} />
                              Answered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                              <Clock size={13} />
                              Pending
                            </span>
                          )}

                          <button
                            onClick={() => handleDelete(c.id)}
                            title="Delete Consultation"
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Question Details */}
                      <div>
                        {isAdmin && c.farmer_name && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1 font-medium">
                            <User size={13} />
                            <span>
                              {c.farmer_name} ({c.farmer_district || 'District'}, {c.farmer_state || 'State'})
                            </span>
                          </div>
                        )}
                        <p className="text-sm text-gray-800 leading-relaxed font-normal bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
                          {c.question}
                        </p>
                        <div className="text-[11px] text-gray-400 mt-1.5">
                          Submitted: {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Recent'}
                        </div>
                      </div>

                      {/* Expert Response Box (if Answered) */}
                      {isAnswered && (
                        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ShieldCheck size={16} className="text-emerald-700" />
                              <span className="text-xs font-bold text-emerald-950">
                                {c.expert_name || 'Senior Agronomist'}
                              </span>
                            </div>
                            <span className="text-[11px] text-emerald-800/80">
                              {c.replied_at ? new Date(c.replied_at).toLocaleDateString() : 'Verified'}
                            </span>
                          </div>
                          <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                            {c.expert_reply}
                          </p>
                        </div>
                      )}

                      {/* Admin Reply Action Box */}
                      {isAdmin && (
                        <div className="pt-2 border-t border-gray-100">
                          {activeReplyId === c.id ? (
                            <div className="space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-700">
                                  {isAnswered ? 'Update Advisory Guidance' : 'Post Advisory Reply'}
                                </span>
                                <button
                                  onClick={() => setActiveReplyId(null)}
                                  className="text-xs text-gray-500 hover:text-gray-800"
                                >
                                  Cancel
                                </button>
                              </div>
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={3}
                                placeholder="Write diagnostic advice, dosage recommendations, or preventative actions..."
                                className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              />
                              <button
                                onClick={() => handlePostReply(c.id)}
                                disabled={replying || !replyText.trim()}
                                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
                              >
                                {replying ? 'Publishing...' : 'Save & Publish Guidance'}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveReplyId(c.id);
                                setReplyText(c.expert_reply || '');
                              }}
                              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                            >
                              <span>{isAnswered ? 'Edit Agronomist Response' : 'Respond as Expert Agronomist'}</span>
                              {activeReplyId === c.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertAdvice;

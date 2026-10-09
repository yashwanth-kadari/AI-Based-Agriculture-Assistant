import React, { useState, useEffect } from 'react';
import { User, Activity, Edit3, Save, X, CheckCircle, Clock, Sprout, Bug, Tractor, TrendingUp, Droplet, Wallet, MapPin, Briefcase } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { getUserHistory, updateProfile } from '../utils/api';
import { INDIAN_STATES, getDistrictsForState } from '../data/indianLocations';

const actionIcons = {
  'Crop Prediction': Sprout,
  'Pest Prediction': Bug,
  'Yield Prediction': Tractor,
  'Market Forecast': TrendingUp,
  'Soil Analysis': Droplet,
  'Financial Planning': Wallet,
};

const actionColors = {
  'Crop Prediction': 'bg-green-100 text-green-700',
  'Pest Prediction': 'bg-orange-100 text-orange-700',
  'Yield Prediction': 'bg-blue-100 text-blue-700',
  'Market Forecast': 'bg-purple-100 text-purple-700',
  'Soil Analysis': 'bg-teal-100 text-teal-700',
  'Financial Planning': 'bg-indigo-100 text-indigo-700',
};

const Profile = ({ user, onLogin }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState(user?.role || 'farmer');

  useEffect(() => {
    if (user?.role) setRole(user.role);
  }, [user]);
  const [state, setState] = useState(user?.state || 'Andhra Pradesh');
  const [district, setDistrict] = useState(user?.district || 'Guntur');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await getUserHistory(user.id);
        setHistory(data.history || []);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user.id]);

  const handleStateChange = (e) => {
    const s = e.target.value;
    setState(s);
    const dists = getDistrictsForState(s);
    setDistrict(dists[0] || '');
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const { data } = await updateProfile({
        user_id: user.id,
        name: name.trim(),
        role: role,
        state: state,
        district: district,
      });
      if (onLogin) onLogin(data.user);
      setSaveMsg('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      setSaveMsg(err.response?.data?.error || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const actions = ['All', ...Object.keys(actionIcons)];
  const filtered = filter === 'All' ? history : history.filter((h) => h.action === filter);
  const currentDistricts = getDistrictsForState(state);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className="text-2xl font-bold text-gray-900">Profile & Regional Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account details, Indian location preferences, and view past activities.</p>
      </div>

      {/* Profile Card */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-eco-gradient flex items-center justify-center shadow-lg flex-shrink-0">
            <User className="h-10 w-10 text-white" />
          </div>

          <div className="flex-1 text-center sm:text-left w-full">
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Indian State</label>
                    <select
                      value={state}
                      onChange={handleStateChange}
                      className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">District / City</label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                    >
                      {currentDistricts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} isLoading={saving} icon={Save} className="py-2 text-sm">
                    Save Changes
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditing(false);
                      setName(user?.name || '');
                      setState(user?.state || 'Andhra Pradesh');
                      setDistrict(user?.district || 'Guntur');
                    }}
                    icon={X}
                    className="py-2 text-sm"
                  >
                    Cancel
                  </Button>
                </div>
                {saveMsg && (
                  <p className={`text-sm ${saveMsg.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>
                    {saveMsg}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <h2 className="text-2xl font-black text-gray-900">{user?.name}</h2>
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-eco-600 hover:bg-eco-50 transition-colors"
                    title="Edit profile & location"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>

                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-emerald-600" />
                    {user?.district || 'Guntur'}, {user?.state || 'Andhra Pradesh'}
                  </span>
                  <span className="badge badge-green">
                    <CheckCircle className="h-3 w-3 mr-1" /> Active Account
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Activity History */}
      <Card title="Activity History" icon={Activity}>
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-4 -mt-1">
          {actions.map((a) => (
            <button
              key={a}
              onClick={() => setFilter(a)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${filter === a
                ? 'bg-eco-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {a}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="loading-ring" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
            <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {history.length === 0
                ? 'No activity yet. Run a crop prediction to get started!'
                : `No ${filter} records found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((record) => {
              const IconComp = actionIcons[record.action] || Activity;
              const colorClass = actionColors[record.action] || 'bg-gray-100 text-gray-600';
              return (
                <div
                  key={record.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors fade-in"
                >
                  <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                    <IconComp className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{record.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{record.details}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(record.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Profile;

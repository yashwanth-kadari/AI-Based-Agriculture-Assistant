import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bug, Cloud, Thermometer, TrendingDown, Sprout, ShieldAlert } from 'lucide-react';
import Card from '../components/Card';
import { getRiskStatus } from '../utils/api';

const getSeverityTheme = (severity) => {
  const s = (severity || 'Low').toString().toLowerCase();
  if (s.includes('critical') || s.includes('high')) {
    return {
      card: 'bg-red-50/90 border-red-300 border-l-4 border-l-red-600 text-red-950',
      badge: 'bg-red-100 text-red-800 border-red-300 font-bold',
      iconBg: 'bg-red-100 text-red-700 border-red-300',
      text: 'text-red-700 font-extrabold',
    };
  }
  if (s.includes('medium') || s.includes('moderate')) {
    return {
      card: 'bg-amber-50/90 border-amber-300 border-l-4 border-l-amber-600 text-amber-950',
      badge: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
      iconBg: 'bg-amber-100 text-amber-700 border-amber-300',
      text: 'text-amber-700 font-extrabold',
    };
  }
  return {
    card: 'bg-emerald-50/90 border-emerald-300 border-l-4 border-l-emerald-600 text-emerald-950',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    text: 'text-emerald-700 font-extrabold',
  };
};

const RiskMonitoring = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getRiskStatus()
      .then(({ data: d }) => setData(d))
      .catch(() => setError('Failed to load risk data.'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-eco-600" />
      </div>
    );
  }

  const riskCards = [
    { label: 'Pest Outbreak Risk', value: data?.pest_outbreak_risk || 'Low', icon: Bug },
    { label: 'Disease Threat', value: data?.disease_risk || 'Low', icon: AlertTriangle },
    { label: 'Weather & Climate Status', value: data?.climate_risk || 'Low', icon: Thermometer },
    { label: 'Soil Health Risk', value: data?.soil_risk || 'Low', icon: Sprout },
    { label: 'Market Volatility Risk', value: data?.market_risk || 'Low', icon: TrendingDown },
    { label: 'Overall Composite Risk', value: data?.overall_risk || 'Low', icon: Cloud },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-eco-600" />
            Climate &amp; Risk Factor Monitoring
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time individual risk breakdown across 6 dimensions: weather, pests, disease, soil health, market volatility, and climate alerts.
          </p>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-sm">{error}</div>}

      {/* Individual Risk Factor Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {riskCards.map((item) => {
          const ItemIcon = item.icon;
          const theme = getSeverityTheme(item.value);
          return (
            <Card key={item.label} className={`${theme.card} p-4 border shadow-xs`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl border ${theme.iconBg}`}>
                  <ItemIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600">{item.label}</p>
                  <p className={`text-base mt-0.5 ${theme.text}`}>{item.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card title="Weather-Based Regional Alerts" icon={Cloud}>
        <div className="space-y-3">
          {(data?.weather_alerts || []).length > 0 ? (
            data.weather_alerts.map((alert, idx) => {
              const theme = getSeverityTheme(alert.severity);
              return (
                <div key={idx} className={`p-4 rounded-xl border ${theme.card}`}>
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider">{alert.alert_type}</h4>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${theme.badge}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-800 mt-2 leading-relaxed">{alert.message}</p>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-xs text-center py-4">No critical weather warnings for your active region.</p>
          )}
        </div>
      </Card>

      <Card title="All Active Farm Risk Alerts" icon={AlertTriangle}>
        <div className="space-y-3">
          {(data?.active_alerts || []).length > 0 ? (
            data.active_alerts.map((alert, idx) => {
              const theme = getSeverityTheme(alert.severity);
              return (
                <div key={idx} className={`p-4 rounded-xl border ${theme.card}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${theme.badge}`}>
                        {alert.alert_type} • {alert.severity}
                      </span>
                      <p className="text-xs text-gray-800 mt-2 leading-relaxed">{alert.message}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-xs text-center py-4">No active risk alerts recorded.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RiskMonitoring;

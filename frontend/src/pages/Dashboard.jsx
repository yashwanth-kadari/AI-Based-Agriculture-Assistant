import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Sprout,
  Leaf,
  AlertTriangle,
  TrendingUp,
  IndianRupee,
} from 'lucide-react';
import Card from '../components/Card';
import { getDashboardData } from '../utils/api';


// ── Farmer Dashboard Component ─────────────────────────────────────────────
const FarmerDashboard = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getDashboardData();
        setData(response.data);
      } catch (err) {
        setError('Failed to load dashboard data. Is the backend running?');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-600" />
      </div>
    );
  }

  const profit = data?.estimated_profit;
  const hasProfitData = profit && (profit.income > 0 || profit.cost > 0 || profit.profit !== 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">{error}</div>
      )}

      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'Farmer'}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here&apos;s what&apos;s happening on your farm today.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-l-4 border-eco-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-eco-100 text-eco-600">
              <Leaf className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Soil Health</p>
              <h3 className="text-xl font-bold text-gray-900 mt-1">{data?.soil_health || 'No test yet'}</h3>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Sprout className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Sustainability Score</p>
              <div className="flex items-baseline mt-1">
                {data?.sustainability_score !== null && data?.sustainability_score !== undefined ? (
                  <>
                    <h3 className="text-xl font-bold text-gray-900">{data.sustainability_score}</h3>
                    <span className="ml-1 text-sm text-gray-500">/ 100</span>
                  </>
                ) : (
                  <h3 className="text-base font-semibold text-gray-400">No score yet</h3>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Overall Risk</p>
              <h3 className="text-xl font-bold text-gray-900 mt-0.5">{data?.overall_risk || 'Low'}</h3>
              {data?.risk_reason && (
                <p className="text-[11px] font-medium text-gray-500 mt-0.5 line-clamp-1" title={data.risk_reason}>
                  {data.risk_reason}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Market Trend</p>
              <h3 className="text-xl font-bold text-green-600 mt-1">{data?.market_trend || 'N/A'}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Crop + Profit Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="AI Recommended Crop" icon={Sprout}>
          {data?.ai_recommended_crop ? (
            <div className="text-center py-4">
              <h2 className="text-3xl font-extrabold text-eco-700 capitalize">
                {data.ai_recommended_crop.crop}
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Confidence: {data.ai_recommended_crop.confidence?.toFixed(1)}% &middot;{' '}
                {data.ai_recommended_crop.date}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-eco-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(data.ai_recommended_crop.confidence ?? 0, 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <Sprout className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-gray-600">No prediction record yet.</p>
              <p className="text-xs text-gray-400 mt-1">Run a crop recommendation test to get personalized AI suggestions.</p>
            </div>
          )}
        </Card>

        <Card title="Estimated Profit Summary" icon={IndianRupee}>
          {hasProfitData ? (
            <>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500">Income</p>
                  <p className="text-lg font-bold text-green-600">₹{profit.income.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cost</p>
                  <p className="text-lg font-bold text-red-500">₹{profit.cost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Net Profit</p>
                  <p className="text-lg font-bold text-eco-700">₹{profit.profit.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Profit Margin</span>
                  <span>{profit.margin}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-eco-600 h-2 rounded-full"
                    style={{ width: `${Math.max(0, Math.min(profit.margin ?? 0, 100))}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <IndianRupee className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-gray-600">No financial records logged yet.</p>
              <p className="text-xs text-gray-400 mt-1">Use the Financial Planning tool to calculate and log your farm costs and revenue.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Today's Market Prices */}
      <Card title="Today's Market Prices" icon={TrendingUp}>
        {data?.market_prices_location_note && (
          <div className="mb-4 px-3.5 py-2 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span>{data.market_prices_location_note}</span>
          </div>
        )}
        {(data?.todays_market_prices ?? []).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mandi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price (₹/unit)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(data?.todays_market_prices ?? []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.crop}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.mandi}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">₹{item.price} / {item.unit || 'kg'}</td>
                    <td
                      className={`px-6 py-4 text-sm font-medium ${String(item.change).startsWith('+')
                        ? 'text-green-600'
                        : String(item.change).startsWith('-')
                          ? 'text-red-600'
                          : 'text-gray-500'
                        }`}
                    >
                      {item.change}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.date || 'Today'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <p className="text-sm font-medium text-gray-600">No active market prices recorded yet.</p>
            <p className="text-xs text-gray-400 mt-1">Market price entries added by administrators will appear here in real-time.</p>
          </div>
        )}
      </Card>

      {/* Crop Recommendations + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Top Recommended Crops" icon={Sprout}>
            {(data?.top_recommendations ?? []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crop</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Season</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sustainability</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(data?.top_recommendations ?? []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.crop_name}</div>
                          <div className="text-sm text-gray-500">{item.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.best_season}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          ₹{item.avg_market_price}/kg
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-eco-600 h-2.5 rounded-full"
                              style={{ width: `${item.sustainability_score ?? 70}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-sm font-medium text-gray-600">No crop recommendations available.</p>
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card title="Recent Alerts" icon={AlertTriangle}>
            <div className="space-y-4">
              {(data?.recent_alerts ?? []).map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-l-4 ${alert.severity === 'Critical'
                    ? 'bg-red-50 border-red-500'
                    : alert.severity === 'High'
                      ? 'bg-orange-50 border-orange-500'
                      : alert.severity === 'Medium'
                        ? 'bg-yellow-50 border-yellow-500'
                        : 'bg-blue-50 border-blue-500'
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-semibold text-gray-900">{alert.alert_type}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{alert.message}</p>
                </div>
              ))}
              {!(data?.recent_alerts?.length) && (
                <p className="text-gray-500 text-sm text-center py-4">No recent alerts.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ── Main Dashboard Router ───────────────────────────────────────────────────
const Dashboard = ({ user }) => {
  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'superadmin' ||
    Boolean(user?.is_super_admin);

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <FarmerDashboard user={user} />;
};

export default Dashboard;

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Sprout, Bug, Tractor, TrendingUp, Droplet, Wallet,
    AlertTriangle, Leaf, ShoppingBag, MessageSquare, BarChart3,
    ArrowRight, Sparkles, CheckCircle2, Shield
} from 'lucide-react';

const farmerFeatureGroups = [
    {
        category: 'AI Predictions & Decision Support',
        description: 'Machine learning tools powered by Gaussian Naïve Bayes models for high-precision farming decisions.',
        items: [
            {
                id: 'crop-rec',
                title: 'Crop Recommendation',
                description: 'Get optimal crop suggestions based on your exact soil NPK, pH, temperature, humidity & rainfall.',
                path: '/crop-recommendation',
                icon: Sprout,
                badge: '99.4% Accuracy',
                badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                btnText: 'Analyze Soil & Recommend',
                accent: 'from-emerald-500 to-teal-600',
            },
            {
                id: 'pest-pred',
                title: 'Pest Outbreak Prediction',
                description: 'Early diagnosis of crop diseases and pest risks to protect your yields before outbreak occurs.',
                path: '/pest-prediction',
                icon: Bug,
                badge: 'Early Warning',
                badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
                btnText: 'Run Pest Diagnostic',
                accent: 'from-amber-500 to-orange-600',
            },
            {
                id: 'yield-pred',
                title: 'Harvest Yield Prediction',
                description: 'Estimate expected crop yield per acre based on cultivation area, crop type, and soil nutrients.',
                path: '/yield-prediction',
                icon: Tractor,
                badge: 'Yield Forecasting',
                badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
                btnText: 'Estimate Harvest Yield',
                accent: 'from-blue-500 to-indigo-600',
            },
            {
                id: 'market-price',
                title: 'Mandi Price Forecast',
                description: 'Live APMC Mandi prices, historical price trends, and revenue batch calculation.',
                path: '/market-price',
                icon: TrendingUp,
                badge: 'Real-Time APMC',
                badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
                btnText: 'Check Market Prices',
                accent: 'from-purple-500 to-violet-600',
            },
        ],
    },
    {
        category: 'Soil, Climate & Sustainability',
        description: 'Comprehensive soil health monitoring, environmental safety alerts, and eco-friendly farming insights.',
        items: [
            {
                id: 'soil-health',
                title: 'Soil Health Analysis',
                description: 'Soil nutrient reports, NPK deficiency diagnosis, and customized fertilizer & irrigation plans.',
                path: '/soil-health',
                icon: Droplet,
                badge: 'NPK Analysis',
                badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
                btnText: 'View Soil Health',
                accent: 'from-teal-500 to-emerald-600',
            },
            {
                id: 'sustainability',
                title: 'Sustainability & Eco-Score',
                description: 'Track sustainable farming practices, water preservation metrics, and soil conservation tips.',
                path: '/sustainability',
                icon: Leaf,
                badge: 'Eco-Score',
                badgeColor: 'bg-green-100 text-green-800 border-green-200',
                btnText: 'Explore Sustainability',
                accent: 'from-green-500 to-emerald-600',
            },
            {
                id: 'risk-mon',
                title: 'Risk & Weather Monitoring',
                description: 'Real-time climate alerts, drought advisories, extreme rainfall warnings, and pest risks.',
                path: '/risk-monitoring',
                icon: AlertTriangle,
                badge: 'Live Alerts',
                badgeColor: 'bg-red-100 text-red-800 border-red-200',
                btnText: 'Check Climate Risks',
                accent: 'from-red-500 to-rose-600',
            },
        ],
    },
    {
        category: 'Farm Economics & Community Trade',
        description: 'Track farm expenses, buy and sell agricultural supplies, and engage with fellow farmers.',
        items: [
            {
                id: 'fin-plan',
                title: 'Financial Planning & Costing',
                description: 'Record seeds, fertilizer, labor & irrigation costs, calculate profits, and manage farm budgets.',
                path: '/financial-planning',
                icon: Wallet,
                badge: 'Profit Estimator',
                badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                btnText: 'Open Budget Calculator',
                accent: 'from-emerald-600 to-green-700',
            },
            {
                id: 'analytics',
                title: 'Farmer Performance Analytics',
                description: 'Visual charts of yield trends, cumulative expenses, income margins, and soil health indicators.',
                path: '/analytics',
                icon: BarChart3,
                badge: 'Visual Reports',
                badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                btnText: 'View Farm Analytics',
                accent: 'from-indigo-500 to-blue-600',
            },
            {
                id: 'marketplace',
                title: 'Agri Marketplace',
                description: 'Direct peer-to-peer trading for seeds, fertilizers, machinery, and harvested produce.',
                path: '/marketplace',
                icon: ShoppingBag,
                badge: 'Peer-to-Peer',
                badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
                btnText: 'Browse Marketplace',
                accent: 'from-orange-500 to-amber-600',
            },
            {
                id: 'community',
                title: 'Farmer Community Forum',
                description: 'Ask farming questions, share harvest experience, and seek advice from verified experts.',
                path: '/community',
                icon: MessageSquare,
                badge: 'Farmer Forum',
                badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
                btnText: 'Join Discussion',
                accent: 'from-sky-500 to-blue-600',
            },
        ],
    },
];

const FarmerFeatures = ({ user }) => {
    const navigate = useNavigate();

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-eco-800 via-emerald-800 to-teal-900 text-white p-8 md:p-10 shadow-xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-bold mb-4">
                        <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                        <span>Integrated Farmer Decision Hub</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                        Smart Features for Modern Agriculture
                    </h1>
                    <p className="mt-3 text-emerald-100 text-sm md:text-base leading-relaxed">
                        Welcome, <span className="font-semibold text-white">{user?.name || 'Farmer'}</span>! Explore our full suite of AI-powered tools, financial management tools, mandi price trackers, and marketplace channels.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-emerald-200">
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> 100% Real-Time AI Predictions</span>
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Verifiable Mandi Market Data</span>
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> MySQL End-to-End Persistence</span>
                    </div>
                </div>
            </div>

            {/* Feature Groups */}
            <div className="space-y-10">
                {farmerFeatureGroups.map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                <span className="w-2.5 h-6 bg-eco-600 rounded-full inline-block" />
                                {group.category}
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">{group.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`p-3 rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-md shadow-gray-200`}>
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${item.badgeColor}`}>
                                                    {item.badge}
                                                </span>
                                            </div>

                                            <h3 className="text-base font-bold text-gray-900 group-hover:text-eco-700 transition-colors">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-gray-50">
                                            <button
                                                onClick={() => navigate(item.path)}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-eco-50 hover:bg-eco-600 text-eco-700 hover:text-white font-bold text-xs transition-all duration-150 cursor-pointer shadow-xs group-hover:bg-eco-600 group-hover:text-white"
                                            >
                                                <span>{item.btnText}</span>
                                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FarmerFeatures;

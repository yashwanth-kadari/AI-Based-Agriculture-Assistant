import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout, BarChart2, ShieldCheck, Sun, ArrowRight, CheckCircle,
  TrendingUp, Leaf, CloudRain, IndianRupee, Zap, Globe
} from 'lucide-react';

const features = [
  {
    icon: Sprout,
    title: 'Smart Crop Recommendation',
    description: 'AI-driven suggestions based on your exact soil NPK, pH, humidity, and rainfall data.',
    color: 'from-green-400 to-emerald-600',
    bg: 'bg-green-50',
    text: 'text-green-700',
  },
  {
    icon: ShieldCheck,
    title: 'Pest & Disease Prediction',
    description: 'Early outbreak detection using Gaussian Naïve Bayes to protect your harvest.',
    color: 'from-orange-400 to-red-600',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
  },
  {
    icon: TrendingUp,
    title: 'Market Price Forecasting',
    description: 'Data-backed price trend analysis to help you sell at the right time.',
    color: 'from-blue-400 to-indigo-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
  },
  {
    icon: Leaf,
    title: 'Soil Health Analysis',
    description: 'Comprehensive NPK analysis with fertilizer and irrigation recommendations.',
    color: 'from-teal-400 to-green-600',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
  },
  {
    icon: IndianRupee,
    title: 'Financial Planning',
    description: 'Calculate production costs, estimate profits, and make smart sell/store decisions.',
    color: 'from-purple-400 to-violet-600',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
  },
  {
    icon: CloudRain,
    title: 'Risk Monitoring',
    description: 'Real-time climate alerts, weather warnings, and crop disease risk tracking.',
    color: 'from-sky-400 to-blue-600',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
  },
];

const stats = [
  { value: '92.2%', label: 'Cross-Validated Accuracy', icon: Zap },
  { value: '5+', label: 'Crop Categories', icon: Sprout },
  { value: '7', label: 'Environmental Factors', icon: Globe },
  { value: '100%', label: 'Free to Use', icon: CheckCircle },
];

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-eco-gradient text-white py-24 lg:py-36 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 bg-hero-pattern pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-eco-500 rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400 rounded-full blur-3xl opacity-10 translate-y-1/2 -translate-x-1/2" />

        {/* Grid dots background */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-eco-100 mb-8">
            <Zap className="w-4 h-4 text-yellow-300" />
            <span>Powered by Gaussian Naïve Bayes AI</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
            Farming Meets{' '}
            <span className="relative">
              <span className="text-eco-300">Artificial</span>
            </span>
            <br />
            <span className="text-eco-200">Intelligence</span>
          </h1>

          <p className="mt-4 text-xl md:text-2xl text-eco-100/90 max-w-3xl mx-auto mb-12 leading-relaxed">
            Empower your farm with data-driven insights. Get AI crop recommendations,
            predict pest outbreaks, forecast market prices, and plan your finances — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/signup">
              <button className="group inline-flex items-center justify-center gap-2 bg-white text-eco-900 font-bold px-8 py-4 rounded-xl text-lg shadow-2xl hover:shadow-white/25 hover:bg-eco-50 transition-all duration-200">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link to="/login">
              <button className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-white/20 transition-all duration-200">
                Sign In
              </button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-eco-200/80 text-sm">
            {['No credit card required', 'Open source', 'MySQL + Flask', 'React powered'].map((text) => (
              <div key={text} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-eco-300" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((item) => {
              const ItemIcon = item.icon;
              return (
                <div key={item.label} className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className="bg-eco-100 p-2 rounded-lg">
                      <ItemIcon className="w-5 h-5 text-eco-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-gray-900">{item.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="badge badge-green mb-4">Complete Platform</span>
            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
              Everything Your Farm Needs
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              A comprehensive suite of AI-powered tools designed to maximize your agricultural productivity and profitability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`inline-flex p-3 rounded-xl ${feature.bg} mb-5`}>
                  <feature.icon className={`w-6 h-6 ${feature.text}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Three simple steps to transform your farming decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Enter Soil Data', desc: 'Input NPK values, temperature, humidity, pH, and rainfall for your field.' },
              { step: '02', title: 'AI Analysis', desc: 'Our Gaussian Naïve Bayes model analyzes your data across multiple dimensions.' },
              { step: '03', title: 'Get Insights', desc: 'Receive crop recommendations, risk alerts, and financial projections instantly.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center relative">
                <div className="inline-flex w-16 h-16 rounded-2xl bg-eco-gradient items-center justify-center text-white font-black text-xl mb-4 shadow-lg shadow-eco-500/30">
                  {step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-eco-gradient py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="max-w-3xl mx-auto px-4 text-center relative">
          <h2 className="text-4xl font-black text-white mb-4">
            Ready to Transform Your Farm?
          </h2>
          <p className="text-eco-100 text-lg mb-10">
            Join farmers using AgriSmart AI to make data-driven decisions and improve their yields.
          </p>
          <Link to="/signup">
            <button className="inline-flex items-center gap-2 bg-white text-eco-900 font-bold px-10 py-4 rounded-xl text-lg shadow-2xl hover:bg-eco-50 transition-all duration-200">
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-eco-900 text-eco-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Sprout className="h-6 w-6 text-eco-400" />
            <span className="font-bold text-white text-lg">AgriSmart AI</span>
          </div>
          <p className="text-sm text-eco-400">
            Built with React · Flask · Gaussian Naïve Bayes · MySQL
          </p>
          <nav className="flex gap-4 text-sm">
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Home;

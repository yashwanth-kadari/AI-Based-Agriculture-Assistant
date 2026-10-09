import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout, Users, Globe, Brain, Database, Code2, Zap,
  CheckCircle, ArrowRight, TrendingUp, ShieldCheck
} from 'lucide-react';

const techStack = [
  { name: 'React.js', desc: 'Modern component-based UI', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { name: 'Tailwind CSS', desc: 'Utility-first styling', color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
  { name: 'Flask', desc: 'Python REST API backend', color: 'bg-orange-50 text-orange-700 border-orange-100' },
  { name: 'Gaussian NB', desc: 'Core ML model', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  { name: 'MySQL', desc: 'Relational database', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  { name: 'Scikit-learn', desc: 'ML pipeline tooling', color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
];

const features = [
  { icon: Brain, title: 'Gaussian Naïve Bayes AI', desc: 'Our core ML algorithm analyzes 7 environmental features to make accurate predictions across crops, pests, and yield levels.' },
  { icon: Database, title: 'MySQL Persistent Storage', desc: 'All predictions, soil reports, financial calculations, and activity history are stored and retrievable at any time.' },
  { icon: ShieldCheck, title: 'Secure Authentication', desc: 'SHA-256 hashed passwords and session-based user management keep your farm data private and secure.' },
  { icon: TrendingUp, title: 'Real-Time Analytics', desc: 'Dynamic charts powered by Recharts show monthly yield activity, profit/loss trends, and risk history.' },
];

const About = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="bg-eco-gradient text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-eco-100 mb-6">
            <Sprout className="h-4 w-4 text-eco-300" />
            <span>Open Source AI Agriculture Project</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-4">
            About <span className="text-eco-300">AgriSmart AI</span>
          </h1>
          <p className="text-eco-100/90 text-xl max-w-2xl mx-auto leading-relaxed">
            A full-stack intelligent decision support system built to bring the power
            of artificial intelligence directly to modern farmers.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Sprout, title: 'Sustainable Farming', desc: 'Our AI models optimize resource usage—fertilizers, water, and labor—promoting environmental sustainability while maintaining high yields.', bg: 'bg-green-50', ic: 'text-green-600' },
              { icon: Users, title: 'Empowering Farmers', desc: 'Designed with accessibility in mind, AgriSmart AI delivers actionable insights directly to the hands of small and large-scale farmers alike.', bg: 'bg-eco-50', ic: 'text-eco-600' },
              { icon: Globe, title: 'Data-Driven Decisions', desc: 'Backed by Gaussian Naïve Bayes models trained on real agricultural datasets, removing the guesswork from critical farming decisions.', bg: 'bg-blue-50', ic: 'text-blue-600' },
            ].map((item) => {
              const ItemIcon = item.icon;
              return (
                <div key={item.title} className={`${item.bg} rounded-2xl p-6 border border-gray-100`}>
                  <div className={`${item.ic} mb-4`}>
                    <ItemIcon className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-12">Technical Highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((item) => {
              const ItemIcon = item.icon;
              return (
                <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex gap-4">
                  <div className="bg-eco-100 p-3 rounded-xl h-fit">
                    <ItemIcon className="h-5 w-5 text-eco-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-4">Technology Stack</h2>
          <p className="text-gray-500 text-center mb-12">Built with production-grade, open-source technologies.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {techStack.map(({ name, desc, color }) => (
              <div key={name} className={`${color} border rounded-xl p-4 text-center`}>
                <Code2 className="h-5 w-5 mx-auto mb-2 opacity-70" />
                <p className="font-bold text-sm">{name}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-eco-gradient py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-4">Start Using AgriSmart AI Today</h2>
          <p className="text-eco-100 mb-8">Create a free account and run your first AI crop prediction in minutes.</p>
          <Link to="/signup">
            <button className="inline-flex items-center gap-2 bg-white text-eco-900 font-bold px-8 py-4 rounded-xl hover:bg-eco-50 transition-colors shadow-xl">
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { submitContact } from '../utils/api';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await submitContact(form);
      setSuccess(data.message || 'Message sent! We will respond within 24 hours.');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contacts = [
    { icon: Mail, label: 'Email', value: 'support@agrismart.ai', color: 'text-blue-600 bg-blue-50' },
    { icon: Phone, label: 'Phone', value: '+91 98765 43210', color: 'text-green-600 bg-green-50' },
    { icon: MapPin, label: 'Location', value: 'India — serving farmers nationwide', color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-12 px-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Get in Touch</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Have questions about AgriSmart AI? We'd love to hear from you. Send us a message and we'll respond within 24 hours.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Form */}
        <Card title="Send a Message" icon={Send}>
          {success && (
            <div className="flex items-start gap-3 bg-green-50 text-green-800 p-4 rounded-xl border border-green-200 mb-4 fade-in">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-4">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Your Name</label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Message</label>
              <textarea
                name="message"
                required
                rows={5}
                value={form.message}
                onChange={handleChange}
                placeholder="How can we help you?"
                className="form-input resize-none"
              />
            </div>
            <Button type="submit" className="w-full py-3" icon={Send} isLoading={loading}>
              Send Message
            </Button>
          </form>
        </Card>

        {/* Contact Info */}
        <div className="space-y-4">
          {contacts.map((item) => {
            const ItemIcon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-4 bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`p-3 rounded-xl ${item.color.split(' ')[1]}`}>
                  <ItemIcon className={`h-5 w-5 ${item.color.split(' ')[0]}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{item.label}</p>
                  <p className="text-gray-800 font-medium mt-0.5">{item.value}</p>
                </div>
              </div>
            );
          })}

          {/* FAQ teaser */}
          <div className="bg-eco-50 border border-eco-100 rounded-xl p-5 mt-4">
            <h3 className="font-bold text-eco-800 mb-2">Common Questions</h3>
            <div className="space-y-2">
              {[
                'How accurate are the crop predictions?',
                'Do I need to train the ML models myself?',
                'Is the backend required to run?',
              ].map((q) => (
                <p key={q} className="text-sm text-eco-700 flex items-start gap-2">
                  <span className="text-eco-400 font-bold mt-0.5">→</span>
                  {q}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

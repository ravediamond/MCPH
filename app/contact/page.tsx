"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, Home, Mail, Phone, MapPin, Clock, CheckCircle, Building, Users, Shield, Zap } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    company: "",
    name: "",
    email: "",
    phone: "",
    role: "",
    employees: "",
    message: "",
    interest: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log("Form submitted:", formData);
    setIsSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (isSubmitted) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <div className="py-8 px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-4">
                Thank You for Your Interest!
              </h1>
              <p className="text-lg text-slate-600 mb-8">
                Our enterprise team has received your inquiry and will contact you within 24 hours to discuss your requirements.
              </p>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-2">What happens next?</h3>
                  <ul className="text-slate-600 space-y-2">
                    <li>• Our enterprise specialist will review your requirements</li>
                    <li>• We'll schedule a personalized demo tailored to your use case</li>
                    <li>• You'll receive a custom proposal with pricing and implementation timeline</li>
                    <li>• Our technical team will assist with proof-of-concept deployment</li>
                  </ul>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="py-8 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <Link
                href="/"
                className="inline-flex items-center px-3 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-all duration-200 hover:shadow-sm"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="inline-flex items-center px-3 py-2 text-slate-600 bg-slate-100 rounded-lg font-medium">
                Contact Enterprise Sales
              </span>
            </div>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">
                  Get Started with Enterprise AI
                </h1>
                <p className="text-lg text-slate-600">
                  Ready to transform your organization's AI workflow? Let's discuss your requirements and create a custom solution.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      required
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your Company"
                    />
                  </div>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your Name"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="you@company.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">
                      Your Role *
                    </label>
                    <select
                      id="role"
                      name="role"
                      required
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select your role</option>
                      <option value="cto">CTO / Chief Technology Officer</option>
                      <option value="cio">CIO / Chief Information Officer</option>
                      <option value="vp-engineering">VP of Engineering</option>
                      <option value="director-it">Director of IT</option>
                      <option value="head-ai">Head of AI / Machine Learning</option>
                      <option value="security-manager">Security Manager</option>
                      <option value="procurement">Procurement / Purchasing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="employees" className="block text-sm font-medium text-slate-700 mb-2">
                      Company Size *
                    </label>
                    <select
                      id="employees"
                      name="employees"
                      required
                      value={formData.employees}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select company size</option>
                      <option value="500-1000">500-1,000 employees</option>
                      <option value="1000-5000">1,000-5,000 employees</option>
                      <option value="5000-10000">5,000-10,000 employees</option>
                      <option value="10000+">10,000+ employees</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="interest" className="block text-sm font-medium text-slate-700 mb-2">
                    Primary Interest *
                  </label>
                  <select
                    id="interest"
                    name="interest"
                    required
                    value={formData.interest}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">What are you most interested in?</option>
                    <option value="deployment">Enterprise deployment options</option>
                    <option value="security">Security and compliance features</option>
                    <option value="integration">AI tool integrations</option>
                    <option value="custom">Custom development</option>
                    <option value="pricing">Pricing and licensing</option>
                    <option value="demo">Schedule a demo</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                    Tell us about your requirements
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="What challenges are you trying to solve? What are your technical requirements? Any specific compliance needs?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Get Enterprise Information
                </button>
              </form>
            </div>

            {/* Contact Info & Features */}
            <div className="space-y-8">
              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <Mail className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-900">Enterprise Sales</h3>
                      <p className="text-slate-600">enterprise@mcph.ai</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Phone className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-900">Sales Hotline</h3>
                      <p className="text-slate-600">+1 (800) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Clock className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-900">Business Hours</h3>
                      <p className="text-slate-600">Mon-Fri: 9 AM - 6 PM PST</p>
                      <p className="text-slate-600">24/7 Enterprise Support</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <MapPin className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-900">Headquarters</h3>
                      <p className="text-slate-600">San Francisco, CA</p>
                      <p className="text-slate-600">Global Support Available</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Why Choose Us */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Why Choose Our Enterprise Platform?
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-6 h-6 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-slate-900">Enterprise Security</h3>
                      <p className="text-slate-600 text-sm">SOC 2 certified, GDPR compliant, with military-grade encryption</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Zap className="w-6 h-6 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-slate-900">Rapid Deployment</h3>
                      <p className="text-slate-600 text-sm">Get up and running in days, not months, with dedicated support</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="w-6 h-6 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-slate-900">Scalable Architecture</h3>
                      <p className="text-slate-600 text-sm">Supports 100,000+ users with 99.9% uptime guarantee</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Building className="w-6 h-6 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-slate-900">Fortune 500 Trusted</h3>
                      <p className="text-slate-600 text-sm">Trusted by leading enterprises worldwide</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
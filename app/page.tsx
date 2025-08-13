"use client";

import Link from "next/link";
import { useAuthRedirect } from "../contexts/useAuthRedirect";

export default function Home() {
  // Redirect authenticated users to their dashboard if needed
  useAuthRedirect({ whenAuthenticated: "/crates" });

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Enterprise Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-700 mb-4">
                Enterprise-Grade AI Infrastructure
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Secure AI Artifact
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Management Platform
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto mb-10 leading-relaxed">
              Transform how your enterprise manages AI-generated content with
              military-grade security, comprehensive audit trails, and seamless
              team collaboration. SOC 2 compliant and enterprise-ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/login"
                className="inline-flex items-center px-10 py-4 border border-transparent text-lg font-semibold rounded-lg shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
              >
                Start Enterprise Trial
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center px-10 py-4 border-2 border-slate-300 text-lg font-semibold rounded-lg text-slate-700 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200"
              >
                View Documentation
              </Link>
            </div>
            <p className="text-sm text-slate-500">
              Trusted by Fortune 500 companies • SOC 2 Type II Certified • GDPR Compliant
            </p>
          </div>

          {/* Enterprise Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="group bg-white p-8 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Military-Grade Security
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Zero-trust architecture, end-to-end encryption, and SOC 2 Type II compliance. Your AI artifacts are protected by the same security standards used by defense contractors.
              </p>
              <ul className="mt-4 text-sm text-slate-500">
                <li>• AES-256 encryption at rest and in transit</li>
                <li>• Multi-factor authentication required</li>
                <li>• Regular penetration testing</li>
              </ul>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:from-green-200 group-hover:to-emerald-200 transition-all duration-300">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Enterprise Collaboration
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Advanced RBAC system with department-level isolation, approval workflows, and real-time collaboration features designed for large organizations.
              </p>
              <ul className="mt-4 text-sm text-slate-500">
                <li>• Granular role-based access control</li>
                <li>• Department and team segregation</li>
                <li>• Approval workflows and governance</li>
              </ul>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-6 group-hover:from-purple-200 group-hover:to-pink-200 transition-all duration-300">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                AI-Native Integration
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Purpose-built for AI workflows with native support for all major LLMs, automated content classification, and intelligent metadata extraction.
              </p>
              <ul className="mt-4 text-sm text-slate-500">
                <li>• Support for GPT, Claude, Gemini, and more</li>
                <li>• Automated content tagging and categorization</li>
                <li>• REST APIs and MCP protocol support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance & Trust Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Enterprise-Ready by Design
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Meet the most stringent enterprise requirements with comprehensive compliance,
              security certifications, and governance controls that scale with your organization.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-8">
                Compliance & Certifications
              </h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">SOC 2 Type II Certified</h4>
                    <p className="text-slate-600">Annual third-party audits ensuring the highest security and availability standards</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">GDPR & CCPA Compliant</h4>
                    <p className="text-slate-600">Full compliance with global privacy regulations and data protection laws</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">HIPAA & FERPA Ready</h4>
                    <p className="text-slate-600">Healthcare and education sector compliance with BAA support</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">ISO 27001 Aligned</h4>
                    <p className="text-slate-600">Information security management system following international best practices</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-10 rounded-3xl border border-slate-200">
              <div className="text-center mb-8">
                <h4 className="text-2xl font-bold text-slate-900 mb-4">
                  Request Enterprise Demo
                </h4>
                <p className="text-slate-600 mb-6">
                  See how our platform can transform your organization's AI workflow
                  management with a personalized demonstration.
                </p>
              </div>
              <form className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Company Name"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Work Email"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Company Size</option>
                    <option>500-1,000 employees</option>
                    <option>1,000-5,000 employees</option>
                    <option>5,000+ employees</option>
                  </select>
                </div>
                <Link
                  href="/contact"
                  className="w-full inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                >
                  Schedule Enterprise Demo
                </Link>
              </form>
              <p className="text-xs text-slate-500 text-center mt-4">
                Trusted by 500+ enterprise customers worldwide
              </p>
            </div>
          </div>

          {/* Enterprise Features Showcase */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Complete Audit Trail</h3>
              <p className="text-slate-600">Every action logged with immutable timestamps, user attribution, and data lineage tracking for complete compliance visibility.</p>
            </div>
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Advanced Encryption</h3>
              <p className="text-slate-600">Military-grade AES-256 encryption at rest and in transit, with customer-managed encryption keys available.</p>
            </div>
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">99.9% Uptime SLA</h3>
              <p className="text-slate-600">Enterprise-grade reliability with multi-region redundancy, automated failover, and 24/7 monitoring.</p>
            </div>
          </div>
        </div>
      </section>
      {/* Customer Testimonials Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Trusted by Enterprise Leaders
            </h2>
            <p className="text-xl text-slate-600">
              See how organizations are transforming their AI workflows
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl font-bold text-blue-600">T</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">TechCorp Global</h4>
                  <p className="text-sm text-slate-500">Fortune 500 Technology</p>
                </div>
              </div>
              <p className="text-slate-700 italic mb-4">
                "The audit capabilities and compliance features have been game-changing for our AI governance. We can now confidently deploy AI tools across all departments."
              </p>
              <p className="text-sm font-medium text-slate-900">- Chief Information Officer</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl font-bold text-green-600">M</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">MedHealth Systems</h4>
                  <p className="text-sm text-slate-500">Healthcare Enterprise</p>
                </div>
              </div>
              <p className="text-slate-700 italic mb-4">
                "HIPAA compliance out-of-the-box and seamless integration with our existing security infrastructure. Setup took days, not months."
              </p>
              <p className="text-sm font-medium text-slate-900">- Head of Digital Innovation</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl font-bold text-purple-600">F</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">FinServ Partners</h4>
                  <p className="text-sm text-slate-500">Financial Services</p>
                </div>
              </div>
              <p className="text-slate-700 italic mb-4">
                "The role-based access controls and data residency options meet all our regulatory requirements. Our teams can collaborate securely on AI projects."
              </p>
              <p className="text-sm font-medium text-slate-900">- VP of Technology Risk</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Secure Your AI Workflow?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join hundreds of enterprise customers who trust us with their most sensitive AI-generated content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center px-10 py-4 border-2 border-white text-lg font-semibold rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-all duration-200"
            >
              Start Free Trial
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center px-10 py-4 border-2 border-white/30 text-lg font-semibold rounded-lg text-white hover:bg-white/10 transition-all duration-200"
            >
              Contact Sales
            </Link>
          </div>
          <p className="text-sm text-blue-200 mt-6">
            30-day free trial • No credit card required • Enterprise support included
          </p>
        </div>
      </section>
    </div>
  );
}

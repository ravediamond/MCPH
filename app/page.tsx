"use client";

import Link from "next/link";
import { useAuthRedirect } from "../contexts/useAuthRedirect";

export default function Home() {
  // Redirect authenticated users to their dashboard if needed
  useAuthRedirect({ whenAuthenticated: "/crates" });

  return (
    <div className="bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen">
      {/* Enterprise Hero Section */}
      <section className="relative overflow-hidden py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-6">
              Enterprise AI Artifact Management Platform
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Securely store, manage, and collaborate on AI-generated artifacts
              within your organization. Built for enterprise teams that need
              compliance, auditability, and controlled access.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Sign In to Platform
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center px-8 py-3 border border-slate-300 text-base font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                View Documentation
              </Link>
            </div>
          </div>

          {/* Enterprise Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Enterprise Security
              </h3>
              <p className="text-slate-600">
                Role-based access controls, audit logging, and compliance-ready
                data management for regulated environments.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Team Collaboration
              </h3>
              <p className="text-slate-600">
                Controlled sharing within your organization with granular
                permissions and version tracking for all artifacts.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">⚙️</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                AI Integration
              </h3>
              <p className="text-slate-600">
                Seamlessly integrate with your existing AI workflows and
                enterprise systems through secure APIs and connectors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Benefits Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Built for Enterprise Requirements
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Meet your organization's security, compliance, and governance
              needs while enabling productive AI collaboration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-6">
                Enterprise-Grade Features
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                    ✓
                  </span>
                  <span className="text-slate-700">
                    SSO/SAML integration with your identity provider
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                    ✓
                  </span>
                  <span className="text-slate-700">
                    Comprehensive audit trails and compliance reporting
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                    ✓
                  </span>
                  <span className="text-slate-700">
                    Data retention policies and automated lifecycle management
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                    ✓
                  </span>
                  <span className="text-slate-700">
                    Role-based permissions and team-based access controls
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-50 p-8 rounded-lg">
              <h4 className="text-lg font-semibold text-slate-900 mb-4">
                Request Enterprise Access
              </h4>
              <p className="text-slate-600 mb-6">
                Contact our enterprise team to discuss deployment options,
                security requirements, and custom integration needs.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-slate-800 hover:bg-slate-900"
              >
                Contact Enterprise Team
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

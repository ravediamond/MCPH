"use client";

import React from "react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            About Our Platform
          </h1>
          <p className="text-slate-600 text-lg">
            Enterprise AI Artifact Management and Collaboration
          </p>
          <p className="text-slate-500 mt-2">
            Secure, compliant, and scalable solution for enterprise AI workflows
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            Enterprise AI Artifact Management
          </h2>
          <p className="text-slate-600 mb-4">
            Our platform provides enterprise-grade infrastructure for managing
            AI-generated artifacts within your organization. Built with
            security, compliance, and scalability as core principles, we enable
            teams to collaborate effectively while maintaining full control over
            sensitive AI-generated content.
          </p>
          <p className="text-slate-600 mb-6">
            Whether your team is generating reports, code, analysis, or other AI
            artifacts, our platform ensures secure storage, controlled access,
            and comprehensive audit trails that meet enterprise requirements.
          </p>

          <h3 className="text-xl font-semibold text-slate-800 mb-3">
            Core Capabilities
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">
                🔒 Enterprise Security
              </h4>
              <ul className="text-slate-600 space-y-1">
                <li>• Role-based access controls</li>
                <li>• AES-256 encryption at rest and in transit</li>
                <li>• SSO/SAML integration</li>
                <li>• Comprehensive audit logging</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">
                👥 Team Collaboration
              </h4>
              <ul className="text-slate-600 space-y-1">
                <li>• Controlled internal sharing</li>
                <li>• Team-based permissions</li>
                <li>• Version control and tracking</li>
                <li>• Workflow integration</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            Compliance and Governance
          </h2>
          <p className="text-slate-600 mb-4">
            Built for organizations with strict compliance requirements, our
            platform provides the governance tools and audit capabilities needed
            for regulated industries.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">
                Data Residency
              </h4>
              <p className="text-slate-600 text-sm">
                Control where your data is stored with configurable data
                residency options.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">
                Retention Policies
              </h4>
              <p className="text-slate-600 text-sm">
                Automated data lifecycle management with configurable retention
                and deletion policies.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">
                Audit Trails
              </h4>
              <p className="text-slate-600 text-sm">
                Complete activity logging with tamper-proof audit trails for
                compliance reporting.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            Integration and APIs
          </h2>
          <p className="text-slate-600 mb-4">
            Seamlessly integrate with your existing enterprise systems and AI
            workflows through our comprehensive API suite and standard protocol
            support.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">
                AI Tool Integration
              </h4>
              <p className="text-slate-600 text-sm mb-2">
                Native support for popular AI platforms:
              </p>
              <ul className="text-slate-600 text-sm space-y-1">
                <li>• Claude AI (Anthropic)</li>
                <li>• ChatGPT Enterprise (OpenAI)</li>
                <li>• Custom AI workflows via MCP</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">
                Enterprise Systems
              </h4>
              <p className="text-slate-600 text-sm mb-2">
                Connect with your existing infrastructure:
              </p>
              <ul className="text-slate-600 text-sm space-y-1">
                <li>• Active Directory / LDAP</li>
                <li>• SIEM and monitoring tools</li>
                <li>• Document management systems</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-slate-100 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Ready to Get Started?
            </h2>
            <p className="text-slate-600 mb-4">
              Contact our enterprise team to discuss your organization's
              requirements and schedule a demonstration.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-slate-800 hover:bg-slate-900 transition-colors duration-200"
            >
              Contact Enterprise Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

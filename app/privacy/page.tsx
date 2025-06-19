"use client";

import React from "react";

export default function PrivacyPage() {
  return (
    <div className="bg-beige-200 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-600">Last updated: June 19, 2025</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            TL;DR: The Short Version
          </h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
            <li>
              We collect minimal technical information (like your IP address for
              security) and keep it for 7 days.
            </li>
            <li>
              Crates you upload are automatically deleted after an expiration
              time you set (the default is 30 days).
            </li>
            <li>We do not track you or sell your data.</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Overview
          </h2>
          <p className="text-gray-600 mb-6">
            MCPH is committed to protecting your privacy. This Privacy Policy
            explains how we collect, use, and safeguard your information when
            you use our crate-sharing service. We've designed our service with
            privacy as a core principle, minimizing data collection and ensuring
            all crates are automatically deleted after their expiration period.
          </p>

          <p className="text-gray-600">
            By using MCPH, you agree to the collection and use of information in
            accordance with this policy.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Information Collection
          </h2>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-primary-500 mb-3">
              Crates and Content
            </h3>
            <p className="text-gray-600 mb-3">
              When you upload crates to MCPH, we temporarily store:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>
                The crate itself (encrypted at rest in Google Cloud Storage)
              </li>
              <li>Basic metadata such as filename, file type, and size</li>
              <li>Expiration time as set by you (default: 30 days)</li>
            </ul>
            <p className="text-gray-600 font-medium">
              All crates and associated metadata are automatically and
              permanently deleted after the expiration period.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-primary-500 mb-3">
              Technical Information
            </h3>
            <p className="text-gray-600 mb-3">
              We collect minimal technical information necessary to provide and
              secure our service:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>IP addresses (for abuse prevention and rate limiting)</li>
              <li>HTTP request information (browser type, referring site)</li>
              <li>Event timestamps (upload and download times)</li>
              <li>Error information (if something goes wrong)</li>
            </ul>
            <p className="text-gray-600 mt-3">
              All logs have a short retention period (7 days) after which they
              are automatically purged.
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            How We Use Information
          </h2>

          <p className="text-gray-600 mb-4">
            We use the information we collect for the following purposes:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-3">
            <li>
              To provide the crate-sharing service (storing and making your
              crates available for download)
            </li>
            <li>
              To enforce expiration times and automatically delete expired
              content
            </li>
            <li>
              To prevent abuse of our service (rate limiting, blocking malicious
              uploads)
            </li>
            <li>To improve the service and fix issues</li>
            <li>
              To gather anonymous aggregate statistics about service usage
            </li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Data Storage and Security
          </h2>

          <p className="text-gray-600 mb-4">
            Crates are stored in Google Cloud Storage with the following
            security measures:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
            <li>Encryption at rest using Google-managed encryption keys</li>
            <li>Transport encryption (TLS/HTTPS) for all data in transit</li>
            <li>Access controls limiting who can access stored crates</li>
            <li>Physical security measures at Google's data centers</li>
          </ul>

          <p className="text-gray-600 mb-4">
            Metadata is stored in Upstash Redis with automatic time-based
            expiration to match crate TTLs.
          </p>

          <p className="text-gray-600 font-medium">
            While we implement robust security measures, no online service can
            guarantee absolute security. Please don't use MCPH for highly
            sensitive information that requires enhanced security guarantees.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Cookie Policy
          </h2>

          <p className="text-gray-600 mb-3">
            MCPH does not use cookies for tracking or advertising purposes.
          </p>
          <p className="text-gray-600">
            We use only essential technical cookies required for the service to
            function correctly (e.g., for CSRF protection).
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Third-Party Services
          </h2>

          <p className="text-gray-600 mb-4">
            We use the following third-party services:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-3">
            <li>
              <strong>Google Cloud Storage</strong> - For crate storage
            </li>
            <li>
              <strong>Upstash Redis</strong> - For metadata and rate limiting
            </li>
            <li>
              <strong>Vercel</strong> - For hosting our application
            </li>
          </ul>
          <p className="text-gray-600 mt-4">
            Each of these services has its own privacy policy, and we encourage
            you to review them. However, our usage of these services is
            configured to maximize privacy and minimize data retention.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Prohibited Content
          </h2>

          <p className="text-gray-600 mb-4">
            The following content is prohibited from being uploaded to MCPH:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Illegal content of any kind</li>
            <li>Malware, viruses, or other harmful software</li>
            <li>Content that violates intellectual property rights</li>
            <li>Explicit adult content or pornography</li>
            <li>Private data of individuals without consent</li>
            <li>Material that promotes harm or violence</li>
          </ul>
          <p className="text-gray-600 mt-4">
            We reserve the right to remove content that violates these terms and
            may cooperate with legal authorities if required.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Contact Us
          </h2>

          <p className="text-gray-600">
            If you have any questions about this Privacy Policy, please contact
            us at:
          </p>
          <p className="text-primary-500 mt-2">privacy@mcph.io</p>
        </div>
      </div>
    </div>
  );
}

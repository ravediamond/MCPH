"use client";

import React from "react";

export default function TermsPage() {
  return (
    <div className="bg-beige-200 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Terms of Service
          </h1>
          <p className="text-gray-600">Last updated: July 15, 2025</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            TL;DR: The Short Version
          </h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
            <li>
              You must not use our service for illegal activities, including
              sharing copyrighted material you don't own.
            </li>
            <li>
              Uploading requires an authenticated account. Links remain active
              until you delete the file.
            </li>
            <li>
              We can remove content and block users who violate these terms.
            </li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            1. Introduction
          </h2>
          <p className="text-gray-600 mb-4">
            Welcome to MCPH ("we," "our," or "us"). By accessing or using our
            crate-sharing service, you agree to be bound by these Terms of
            Service ("Terms"). If you disagree with any part of the Terms, you
            do not have permission to access or use our service.
          </p>

          <p className="text-gray-600">
            MCPH provides an AI artifact sharing service with persistent storage
            for authenticated users. Authenticated user crates are stored
            indefinitely until you choose to delete them.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            2. Service Description
          </h2>

          <p className="text-gray-600 mb-4">
            MCPH allows you to upload crates and receive a link that you can
            share with others to download those crates. Key features of our
            service include:
          </p>

          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
            <li>
              To upload or otherwise add content to MCPH you must authenticate
              using an approved OAuth provider (Google or GitHub).
            </li>
            <li>
              Your crates remain stored indefinitely. You may delete a crate at
              any time via the dashboard or API; deletion is permanent after 30
              days in cold backup.
            </li>
            <li>
              Maximum file size limit of 10MB per upload for free accounts
            </li>
            <li>Rate limits to prevent abuse</li>
          </ul>

          <p className="text-gray-600">
            We reserve the right to modify these limits at any time to ensure
            service stability and prevent abuse.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            3. Acceptable Use
          </h2>

          <p className="text-gray-600 mb-4">
            You agree not to use MCPH for any illegal or unauthorized purpose.
            Prohibited activities include but are not limited to:
          </p>

          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
            <li>Uploading, sharing, or distributing illegal content</li>
            <li>Uploading malware, viruses, or other malicious software</li>
            <li>
              Attempting to circumvent our service restrictions or security
              measures
            </li>
            <li>Using our service to spam or harass others</li>
            <li>
              Uploading content that infringes on intellectual property rights
            </li>
            <li>Uploading explicit adult content or pornography</li>
            <li>
              Using automated scripts to interact with our service without our
              permission
            </li>
            <li>Attempting to overload or attack our servers</li>
          </ul>

          <p className="text-gray-600">
            We reserve the right to remove any content that violates these terms
            and to block access to users who repeatedly violate our Terms of
            Service.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            4. Intellectual Property
          </h2>

          <p className="text-gray-600 mb-4">
            You retain all ownership rights to the crates you upload. By
            uploading crates to MCPH, you grant us a limited license to store
            and make your crates available for download. Authenticated user
            crates are stored indefinitely until you choose to delete them.
          </p>

          <p className="text-gray-600 mb-4">
            You represent and warrant that you have all necessary rights to the
            crates you upload and that your use of MCPH does not violate any
            third party's intellectual property rights.
          </p>

          <p className="text-gray-600">
            MCPH's name, logo, website design, and service interface are owned
            by us and protected by applicable copyright and trademark laws.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            5. Disclaimer of Warranties
          </h2>

          <p className="text-gray-600 mb-4">
            MCPH is provided "as is" and "as available" without warranties of
            any kind, either express or implied, including but not limited to
            the implied warranties of merchantability, fitness for a particular
            purpose, or non-infringement.
          </p>

          <p className="text-gray-600 mb-4">
            We do not guarantee that our service will be uninterrupted, timely,
            secure, or error-free. Crates may be lost in case of service issues
            or maintenance.
          </p>

          <p className="text-gray-600 font-medium">
            We strongly recommend keeping backup copies of any important crates
            you upload to our service, as we cannot guarantee their availability
            indefinitely despite our persistent storage policy.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            6. Limitation of Liability
          </h2>

          <p className="text-gray-600 mb-4">
            To the maximum extent permitted by law, MCPH shall not be liable for
            any indirect, incidental, special, consequential, or punitive
            damages, or any loss of profits or revenues, whether incurred
            directly or indirectly, or any loss of data, use, goodwill, or other
            intangible losses resulting from:
          </p>

          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Your use or inability to use our service</li>
            <li>Accidental deletion or loss of your uploaded crates</li>
            <li>Unauthorized access to or alteration of your uploads</li>
            <li>Any third party conduct or content on our service</li>
            <li>Any other matter relating to our service</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            7. Changes to Terms
          </h2>

          <p className="text-gray-600 mb-4">
            We reserve the right to modify these Terms at any time. We will
            provide notice of significant changes by posting the updated Terms
            on our website.
          </p>

          <p className="text-gray-600">
            Your continued use of MCPH after such changes constitutes your
            acceptance of the new Terms.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            8. Contact Information
          </h2>

          <p className="text-gray-600 mb-4">
            If you have any questions or concerns about these Terms, please
            contact us at:
          </p>
          <p className="text-primary-500">legal@mcph.io</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Change Log
          </h2>
          <p className="text-gray-600 mb-2">
            <strong>15 Jul 2025</strong> – Removed guest-upload language;
            clarified indefinite retention.
          </p>
        </div>
      </div>
    </div>
  );
}

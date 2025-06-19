"use client";

import React from "react";
import Link from "next/link";
import Button from "components/ui/Button";
import Image from "next/image";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="bg-beige-200 min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">About MCPH</h1>
          <p className="text-gray-600 text-lg">
            Secure, ephemeral crate-sharing made simple
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Our Mission
          </h2>
          <p className="text-gray-600 mb-6">
            MCPH was built with a simple mission: to make secure crate sharing
            effortless while prioritizing privacy through ephemeral storage. We
            believe that crate sharing should be simple, secure, and respect
            your privacy by default.
          </p>

          <p className="text-gray-600 mb-6">
            Our service is designed for those moments when you need to quickly
            share crates without the overhead of creating accounts or managing
            complex permissions. Crates are automatically deleted after their
            expiration time, ensuring that your data doesn't persist longer than
            needed.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
            Key Principles
          </h3>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>
              <strong>Privacy by Default</strong> - All crates automatically
              expire and are completely purged from our systems.
            </li>
            <li>
              <strong>No Authentication Required</strong> - We don't track users
              or require account creation.
            </li>
            <li>
              <strong>Simplicity First</strong> - Upload, share, done. No
              unnecessary complexity.
            </li>
            <li>
              <strong>AI Integration</strong> - Built-in API for AI systems to
              use with SSE endpoints.
            </li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            How It Works
          </h2>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-primary-500 mb-3">
              Technical Architecture
            </h3>
            <p className="text-gray-600 mb-4">
              MCPH is built using modern technologies to ensure reliability,
              security, and performance:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                <strong>Frontend:</strong> Next.js 15+ with TypeScript and React
                19
              </li>
              <li>
                <strong>Storage:</strong> Google Cloud Storage for secure file
                hosting with automatic lifecycle management
              </li>
              <li>
                <strong>Metadata &amp; TTL:</strong> Upstash Redis for
                high-performance file metadata and time-based expiration
              </li>
              <li>
                <strong>Deployment:</strong> Hosted on Vercel with edge
                functions for global performance
              </li>
              <li>
                <strong>Cleanup:</strong> Automated purge mechanisms via Vercel
                Cron jobs
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-primary-500 mb-3">
              Security &amp; Privacy
            </h3>
            <p className="text-gray-600 mb-4">
              We've designed MCPH with security and privacy as core principles:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                Files are stored with encryption at rest in Google Cloud Storage
              </li>
              <li>All transfers are encrypted via HTTPS</li>
              <li>
                We maintain minimal logs (IP addresses for abuse prevention
                only, with short retention)
              </li>
              <li>File metadata is completely purged when files expire</li>
              <li>No tracking cookies or user profiling</li>
            </ul>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Trust & Transparency
          </h2>
          <p className="text-gray-600 mb-4">
            We believe in being open about our security and privacy practices.
            Your trust is important to us, and we are committed to protecting
            your data.
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>
              <strong>Encryption in Transit:</strong> All data is transmitted
              securely over HTTPS, ensuring it is encrypted between you and our
              servers.
            </li>
            <li>
              <strong>Encryption at Rest:</strong> Your files are stored on
              Google Cloud Storage, which automatically encrypts all data at
              rest.
            </li>
            <li>
              <strong>Ephemeral by Design:</strong> Crates are automatically and
              permanently deleted after their expiration time.
            </li>
            <li>
              <strong>No User Tracking:</strong> We do not require accounts or
              track personal information.
            </li>
          </ul>
        </div>

        <div className="text-center mt-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Get Started
          </h2>
          <p className="text-gray-600 mb-6">
            Ready to experience simple, secure crate sharing?{" "}
            <Link href="/get-started" passHref>
              <Button variant="primary">Get Started Now</Button>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

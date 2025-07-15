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
            AI artifact storage and sharing made simple
          </p>
          <p className="text-gray-500 mt-2">
            Where AI tools come to store, package, and share their artifacts
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            What is MCPH?
          </h2>
          <p className="text-gray-600 mb-4">
            MCPH stands for <strong>Model Context Protocol Harbor</strong>,
            where the "H" represents a harbor where boats (AI tools and models)
            come to store, leave, and share their crates (packaged artifacts).
          </p>

          <div className="flex items-center justify-center my-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 max-w-3xl">
              <h3 className="text-xl font-semibold text-primary-500 mb-3 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                The Harbor Metaphor
              </h3>
              <p className="text-gray-600 mb-3">
                Think of MCPH as a digital harbor where:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>
                  <strong>The Harbor (Hub)</strong> - A central place where
                  different vessels can dock, exchange cargo, and continue their
                  journey
                </li>
                <li>
                  <strong>Boats</strong> - Various AI tools and models that
                  visit the harbor
                </li>
                <li>
                  <strong>Crates</strong> - Standardized packages containing AI
                  artifacts (outputs, models, data) that can be easily loaded,
                  unloaded, and transported
                </li>
                <li>
                  <strong>Loading/Unloading</strong> - The process of storing
                  and retrieving artifacts from the system
                </li>
                <li>
                  <strong>Shipping Routes</strong> - The pathways through which
                  artifacts are shared between different tools and users
                </li>
              </ul>
              <p className="text-gray-600 mt-3">
                Just as a harbor provides a standardized way for boats of all
                sizes to dock and exchange cargo in crates, MCPH provides a
                standardized way for AI tools to store and share their artifacts
                in a consistent format.
              </p>
            </div>
          </div>

          <p className="text-gray-600">
            This metaphor reflects our core philosophy: creating a universal
            system where AI artifacts can be packaged, stored, shared, and
            transported between different tools and platforms with minimal
            friction.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Our Mission
          </h2>
          <p className="text-gray-600 mb-6">
            MCPH was built with a simple mission: to make storing and sharing
            AI-generated artifacts effortless while prioritizing privacy through
            smart storage management. We believe that packaging artifacts in
            standardized crates should be simple, secure, and respect your
            privacy by default.
          </p>

          <p className="text-gray-600 mb-6">
            Our service is designed for those moments when you need to quickly
            store and share artifacts created by AI tools. Like shipping
            containers in a harbor, our crates are standardized, secure, and
            persistent. Creators authenticate once to upload; anyone with the
            link can read, no account needed.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
            Harbor Principles
          </h3>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>
              <strong>Persistent Storage</strong> - Authenticated user crates
              are stored indefinitely until you choose to delete them, giving
              you full control over your data.
            </li>
            <li>
              <strong>Open Harbor Policy</strong> - We don't track visitors.
            </li>
            <li>
              <strong>Streamlined Operations</strong> - Upload, share, done. No
              unnecessary complexity in our loading procedures.
            </li>
            <li>
              <strong>AI-Friendly Port</strong> - Built-in API for AI systems to
              use with SSE endpoints, allowing easy docking for all AI tools.
            </li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            How It Works
          </h2>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-primary-500 mb-3">
              Harbor Infrastructure
            </h3>
            <p className="text-gray-600 mb-4">
              Our digital harbor (MCPH) is built using modern technologies to
              ensure reliability, security, and performance:
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
              Harbor Security &amp; Privacy
            </h3>
            <p className="text-gray-600 mb-4">
              We've designed our harbor with security and privacy as core
              principles:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                Crates are stored with encryption at rest in our secure storage
                facilities
              </li>
              <li>All shipping routes (transfers) are encrypted via HTTPS</li>
              <li>
                We maintain minimal harbor logs (IP addresses for abuse
                prevention only, with short retention)
              </li>
              <li>
                Cargo manifests (file metadata) are completely purged when
                crates expire
              </li>
              <li>No tracking or profiling of ships that dock at our harbor</li>
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
            </li>{" "}
            <li>
              <strong>Persistent by Design:</strong> Authenticated user crates
              remain in our harbor indefinitely until you decide to remove them,
              ensuring your AI artifacts are always available when you need
              them.
            </li>
            <li>
              <strong>No User Tracking:</strong> We do not track personal
              information.
            </li>
          </ul>
        </div>

        <div className="text-center mt-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Dock at Our Harbor
          </h2>
          <p className="text-gray-600 mb-6">
            Ready to bring your AI tools into our harbor and experience simple,
            secure crate sharing?{" "}
            <Link href="/get-started" passHref>
              <Button variant="primary">Get Started Now</Button>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

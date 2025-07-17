"use client";

import React from "react";
import Link from "next/link";
import { FaLock } from "react-icons/fa";
import Card from "../ui/Card";

interface PasswordPromptProps {
  passwordInput: string;
  setPasswordInput: (value: string) => void;
  passwordError: string | null;
  contentLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function PasswordPrompt({
  passwordInput,
  setPasswordInput,
  passwordError,
  contentLoading,
  onSubmit,
}: PasswordPromptProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-center mb-4">
          <FaLock className="text-primary-500 text-3xl" />
        </div>
        <h1 className="text-xl font-medium text-center text-gray-800 mb-4">
          Password Protected Crate
        </h1>
        <p className="text-gray-600 mb-4 text-center">
          This crate requires a password to access.
        </p>

        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          {passwordError && (
            <div className="mb-4 text-red-600 text-sm">{passwordError}</div>
          )}

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={contentLoading}
              className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white text-base font-medium rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 transition-colors border border-blue-600 disabled:opacity-50"
            >
              {contentLoading ? "Loading..." : "Access Crate"}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-primary-500 hover:text-primary-600 text-sm"
          >
            Return to Home
          </Link>
        </div>
      </Card>
    </div>
  );
}

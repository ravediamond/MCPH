"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";

export default function FeedbackPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          email: email || undefined,
          userId: user?.uid,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit feedback");
      setSuccess(true);
      setMessage("");
      setEmail("");
    } catch (err) {
      setError("Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-4">Feedback</h1>
      <p className="mb-6 text-gray-600">
        We appreciate your thoughts and suggestions about MCPH.
      </p>
      {success && (
        <div className="mb-4 text-green-600">Thank you for your feedback!</div>
      )}
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium" htmlFor="message">
            Message
          </label>
          <textarea
            id="message"
            className="w-full border rounded p-2"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium" htmlFor="email">
            Email (optional)
          </label>
          <input
            id="email"
            type="email"
            className="w-full border rounded p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading || !message.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded">
          {loading ? "Sending..." : "Send Feedback"}
        </Button>
      </form>
    </div>
  );
}


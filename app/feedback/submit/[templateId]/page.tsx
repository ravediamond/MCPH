"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaStar } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { FeedbackFieldType } from "@/shared/types/feedback";

interface FeedbackField {
  key: string;
  type: FeedbackFieldType;
  label: string;
  required: boolean;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  placeholder?: string;
}

interface FeedbackTemplate {
  id: string;
  title: string;
  description?: string;
  fields: FeedbackField[];
  isPublic: boolean;
  submissionCount: number;
  isOpen: boolean;
  closedAt?: string;
}

export default function SubmitFeedbackPage({
  params,
}: {
  params: { templateId: string };
}) {
  const router = useRouter();
  const { getIdToken } = useAuth();
  const { templateId } = params;

  const [template, setTemplate] = useState<FeedbackTemplate | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/feedback/template/${templateId}`);

      if (!response.ok) {
        throw new Error("Template not found or not accessible");
      }

      const data = await response.json();
      setTemplate(data.template);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!template) throw new Error("Template not loaded");

      // Validate required fields
      for (const field of template.fields) {
        if (
          field.required &&
          (!responses[field.key] || responses[field.key] === "")
        ) {
          throw new Error(`${field.label} is required`);
        }
      }

      // Get authentication token (optional for feedback submission)
      const token = await getIdToken();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/feedback/submit", {
        method: "POST",
        headers,
        body: JSON.stringify({
          templateId,
          responses,
          metadata: {
            source: "web",
            userAgent: navigator.userAgent,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit feedback");
      }

      setSuccess(true);
      setResponses({});
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FeedbackField) => {
    const value = responses[field.key];

    switch (field.type) {
      case FeedbackFieldType.TEXT:
        return (
          <textarea
            value={value || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            required={field.required}
          />
        );

      case FeedbackFieldType.NUMBER:
        return (
          <input
            type="number"
            value={value || ""}
            onChange={(e) =>
              handleFieldChange(field.key, parseFloat(e.target.value) || "")
            }
            min={field.minValue}
            max={field.maxValue}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            required={field.required}
          />
        );

      case FeedbackFieldType.BOOLEAN:
        return (
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={field.key}
                value="true"
                checked={value === true}
                onChange={() => handleFieldChange(field.key, true)}
                className="mr-2"
                required={field.required}
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={field.key}
                value="false"
                checked={value === false}
                onChange={() => handleFieldChange(field.key, false)}
                className="mr-2"
                required={field.required}
              />
              No
            </label>
          </div>
        );

      case FeedbackFieldType.SELECT:
        return (
          <select
            value={value || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            required={field.required}
          >
            <option value="">Select an option...</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case FeedbackFieldType.MULTISELECT:
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleFieldChange(field.key, [...currentValues, option]);
                    } else {
                      handleFieldChange(
                        field.key,
                        currentValues.filter((v) => v !== option),
                      );
                    }
                  }}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        );

      case FeedbackFieldType.RATING:
        const maxStars = field.maxValue || 5;
        const minStars = field.minValue || 1;

        return (
          <div className="flex items-center space-x-1">
            {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleFieldChange(field.key, star)}
                className={`text-2xl ${
                  star <= (value || 0) ? "text-yellow-400" : "text-gray-300"
                } hover:text-yellow-400 transition-colors`}
              >
                <FaStar />
              </button>
            ))}
            {value && (
              <span className="ml-2 text-sm text-gray-600">
                {value} / {maxStars}
              </span>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            required={field.required}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error && !template) {
    return (
      <div className="bg-beige-200 min-h-screen py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
            <h1 className="text-xl font-semibold text-red-800 mb-2">
              Template Not Found
            </h1>
            <p className="text-red-700 mb-4">{error}</p>
            <Link
              href="/crates"
              className="inline-flex items-center text-red-600 hover:text-red-800"
            >
              <FaArrowLeft className="mr-2" /> Back to Crates
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (template && !template.isOpen) {
    return (
      <div className="bg-beige-200 min-h-screen py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 text-center">
            <h1 className="text-xl font-semibold text-yellow-800 mb-2">
              Feedback Template Closed
            </h1>
            <p className="text-yellow-700 mb-2">
              The feedback template "{template.title}" is currently closed and
              not accepting new responses.
            </p>
            {template.closedAt && (
              <p className="text-sm text-yellow-600 mb-4">
                Closed on {new Date(template.closedAt).toLocaleDateString()}
              </p>
            )}
            <Link
              href="/crates"
              className="inline-flex items-center text-yellow-600 hover:text-yellow-800"
            >
              <FaArrowLeft className="mr-2" /> Back to Crates
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-beige-200 min-h-screen py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-6 text-center">
            <h1 className="text-xl font-semibold text-green-800 mb-2">
              Thank You!
            </h1>
            <p className="text-green-700 mb-4">
              Your feedback has been submitted successfully.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/crates"
                className="inline-flex items-center text-green-600 hover:text-green-800"
              >
                <FaArrowLeft className="mr-2" /> Back to Crates
              </Link>
              <button
                onClick={() => {
                  setSuccess(false);
                  setResponses({});
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Submit Another Response
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-beige-200 min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <Link
            href="/crates"
            className="inline-flex items-center text-gray-600 hover:text-primary-500 mb-4"
          >
            <FaArrowLeft className="mr-2" /> Back to Crates
          </Link>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {template?.title}
          </h1>
          {template?.description && (
            <p className="text-gray-600">{template.description}</p>
          )}
          <div className="text-sm text-gray-500 mt-2">
            {template?.submissionCount} responses so far
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-700 text-sm">{error}</div>
              </div>
            )}

            {template?.fields.map((field, index) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                {renderField(field)}
              </div>
            ))}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

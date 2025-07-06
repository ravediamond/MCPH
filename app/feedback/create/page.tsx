"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaPlus, FaTrash, FaStar } from "react-icons/fa";
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

export default function CreateFeedbackPage() {
  const router = useRouter();
  const { user, loading, getIdToken } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [linkedCrates, setLinkedCrates] = useState<string[]>([]);
  const [crateInput, setCrateInput] = useState("");
  const [fields, setFields] = useState<FeedbackField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?next=/feedback/create`);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) return null;

  const addField = () => {
    const newField: FeedbackField = {
      key: `field_${fields.length + 1}`,
      type: FeedbackFieldType.TEXT,
      label: `Field ${fields.length + 1}`,
      required: false,
    };
    setFields([...fields, newField]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<FeedbackField>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setFields(updatedFields);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const addCrate = () => {
    if (crateInput.trim() && !linkedCrates.includes(crateInput.trim())) {
      setLinkedCrates([...linkedCrates, crateInput.trim()]);
      setCrateInput("");
    }
  };

  const removeCrate = (crateToRemove: string) => {
    setLinkedCrates(linkedCrates.filter((crate) => crate !== crateToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate form
      if (!title.trim()) {
        throw new Error("Template title is required");
      }
      if (fields.length === 0) {
        throw new Error("At least one field is required");
      }

      // Validate field keys are unique
      const fieldKeys = fields.map((f) => f.key);
      const uniqueKeys = new Set(fieldKeys);
      if (fieldKeys.length !== uniqueKeys.size) {
        throw new Error("Field keys must be unique");
      }

      // Get authentication token
      const token = await getIdToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      // Call your API to create the feedback template
      const response = await fetch("/api/feedback/template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          fields,
          isPublic,
          tags: tags.length > 0 ? tags : undefined,
          linkedCrates: linkedCrates.length > 0 ? linkedCrates : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to create feedback template",
        );
      }

      const result = await response.json();

      // Redirect to crates page
      router.push(`/crates`);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-beige-200 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link
            href="/crates"
            className="inline-flex items-center text-gray-600 hover:text-primary-500 mb-4"
          >
            <FaArrowLeft className="mr-2" /> Back to Crates
          </Link>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Create Feedback Template
          </h1>
          <p className="text-gray-600">
            Design a custom feedback form to collect responses from users.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-700 text-sm">{error}</div>
              </div>
            )}

            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Product Feedback Survey"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visibility
                  </label>
                  <select
                    value={isPublic ? "public" : "private"}
                    onChange={(e) => setIsPublic(e.target.value === "public")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Describe what this feedback template is for..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-orange-500 hover:text-orange-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Add a tag..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Linked Crates (Optional)
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  Link this feedback template to specific crates to collect
                  targeted feedback.
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {linkedCrates.map((crate, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {crate}
                      <button
                        type="button"
                        onClick={() => removeCrate(crate)}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={crateInput}
                    onChange={(e) => setCrateInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addCrate())
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter crate ID..."
                  />
                  <button
                    type="button"
                    onClick={addCrate}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Form Fields
                </h2>
                <button
                  type="button"
                  onClick={addField}
                  className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                >
                  <FaPlus className="mr-2" /> Add Field
                </button>
              </div>

              {fields.length === 0 && (
                <div className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-md">
                  No fields added yet. Click "Add Field" to create your first
                  field.
                </div>
              )}

              {fields.map((field, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-md mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-md font-medium text-gray-800">
                      Field {index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Field Key
                      </label>
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) =>
                          updateField(index, { key: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="e.g., overall_rating"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Field Type
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateField(index, {
                            type: e.target.value as FeedbackFieldType,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value={FeedbackFieldType.TEXT}>Text</option>
                        <option value={FeedbackFieldType.NUMBER}>Number</option>
                        <option value={FeedbackFieldType.BOOLEAN}>
                          Yes/No
                        </option>
                        <option value={FeedbackFieldType.SELECT}>
                          Single Choice
                        </option>
                        <option value={FeedbackFieldType.MULTISELECT}>
                          Multiple Choice
                        </option>
                        <option value={FeedbackFieldType.RATING}>Rating</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Label
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          updateField(index, { label: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="e.g., Overall Rating"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`required-${index}`}
                        checked={field.required}
                        onChange={(e) =>
                          updateField(index, { required: e.target.checked })
                        }
                        className="mr-2"
                      />
                      <label
                        htmlFor={`required-${index}`}
                        className="text-sm text-gray-700"
                      >
                        Required field
                      </label>
                    </div>
                  </div>

                  {/* Type-specific options */}
                  {(field.type === FeedbackFieldType.SELECT ||
                    field.type === FeedbackFieldType.MULTISELECT) && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options (one per line)
                      </label>
                      <textarea
                        value={field.options?.join("\n") || ""}
                        onChange={(e) =>
                          updateField(index, {
                            options: e.target.value
                              .split("\n")
                              .filter((o) => o.trim()),
                          })
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                      />
                    </div>
                  )}

                  {field.type === FeedbackFieldType.RATING && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Min Value
                        </label>
                        <input
                          type="number"
                          value={field.minValue || 1}
                          onChange={(e) =>
                            updateField(index, {
                              minValue: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Value
                        </label>
                        <input
                          type="number"
                          value={field.maxValue || 5}
                          onChange={(e) =>
                            updateField(index, {
                              maxValue: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  )}

                  {field.type === FeedbackFieldType.TEXT && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Placeholder
                      </label>
                      <input
                        type="text"
                        value={field.placeholder || ""}
                        onChange={(e) =>
                          updateField(index, { placeholder: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Enter placeholder text..."
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create Template"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

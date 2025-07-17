"use client";

import React, { useState } from "react";
import {
  FaCheck,
  FaShareAlt,
  FaInfoCircle,
  FaCopy,
  FaTwitter,
  FaReddit,
  FaLinkedin,
  FaDiscord,
  FaTelegram,
  FaEnvelope,
  FaLink,
  FaLock,
  FaGlobe,
  FaUser,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaRandom,
  FaExclamationTriangle,
} from "react-icons/fa";

type AccessLevel = "private" | "link-only" | "public" | "public-password";

interface CrateSharingModalProps {
  showSharingModal: boolean;
  setShowSharingModal: (show: boolean) => void;
  sharingError: string | null;
  sharingSuccess: string | null;
  isPublic: boolean;
  setIsPublic: (isPublic: boolean) => void;
  isPasswordProtected: boolean;
  setIsPasswordProtected: (isPasswordProtected: boolean) => void;
  sharingPassword: string;
  setSharingPassword: (password: string) => void;
  shareUrl: string;
  linkCopied: boolean;
  setLinkCopied: (copied: boolean) => void;
  crateId: string;
  socialLinkCopied: boolean;
  setSocialLinkCopied: (copied: boolean) => void;
  socialShareMessage: string;
  setSocialShareMessage: (message: string) => void;
  handleSocialShare: (platform: string) => void;
  handleCopySocialLink: () => void;
  handleUpdateSharing: () => void;
  sharingLoading: boolean;
  crateTitle?: string;
}

export default function CrateSharingModal({
  showSharingModal,
  setShowSharingModal,
  sharingError,
  sharingSuccess,
  isPublic,
  setIsPublic,
  isPasswordProtected,
  setIsPasswordProtected,
  sharingPassword,
  setSharingPassword,
  shareUrl,
  linkCopied,
  setLinkCopied,
  crateId,
  socialLinkCopied,
  setSocialLinkCopied,
  socialShareMessage,
  setSocialShareMessage,
  handleSocialShare,
  handleCopySocialLink,
  handleUpdateSharing,
  sharingLoading,
  crateTitle = "Untitled Crate",
}: CrateSharingModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Determine current access level based on props
  const getCurrentAccessLevel = (): AccessLevel => {
    if (!isPublic) return "private";
    if (isPublic && isPasswordProtected) return "public-password";
    if (isPublic) return "link-only"; // Default to link-only for public without password
    return "link-only";
  };

  const [accessLevel, setAccessLevel] = useState<AccessLevel>(
    getCurrentAccessLevel(),
  );

  // Update parent state when access level changes
  const handleAccessLevelChange = (newLevel: AccessLevel) => {
    setAccessLevel(newLevel);

    switch (newLevel) {
      case "private":
        setIsPublic(false);
        setIsPasswordProtected(false);
        break;
      case "link-only":
        setIsPublic(true);
        setIsPasswordProtected(false);
        break;
      case "public":
        setIsPublic(true);
        setIsPasswordProtected(false);
        break;
      case "public-password":
        setIsPublic(true);
        setIsPasswordProtected(true);
        break;
    }
  };

  // Generate a secure password
  const generateSecurePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSharingPassword(password);
  };

  // Get password strength
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "No password", color: "gray" };
    if (password.length < 6)
      return { strength: 25, label: "Weak", color: "red" };
    if (password.length < 8)
      return { strength: 50, label: "Fair", color: "yellow" };
    if (password.length < 12)
      return { strength: 75, label: "Good", color: "blue" };
    return { strength: 100, label: "Strong", color: "green" };
  };

  const passwordStrength = getPasswordStrength(sharingPassword);

  // Copy link with success toast
  const handleCopyLink = () => {
    const canonicalUrl = shareUrl.replace(
      /^https?:\/\/localhost:\d+/,
      "https://mcph.io",
    );
    navigator.clipboard.writeText(canonicalUrl);
    setLinkCopied(true);
    setCopySuccess("Link copied (anyone with link can view)");
    setTimeout(() => {
      setLinkCopied(false);
      setCopySuccess(null);
    }, 3000);
  };

  if (!showSharingModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Manage Sharing</h3>
          <button
            onClick={() => setShowSharingModal(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="text-xl">&times;</span>
          </button>
        </div>

        {sharingError && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 text-sm rounded">
            {sharingError}
          </div>
        )}

        {sharingSuccess && (
          <div className="mb-4 p-2 bg-green-100 text-green-700 text-sm rounded">
            {sharingSuccess}
          </div>
        )}

        {/* Success Toast */}
        {copySuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-700">
              <FaCheck className="mr-2" />
              <span className="text-sm font-medium">{copySuccess}</span>
            </div>
          </div>
        )}

        {/* Share Link Hero Section */}
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-3">Share Link</h4>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="text"
                value={shareUrl.replace(
                  /^https?:\/\/localhost:\d+/,
                  "https://mcph.io",
                )}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white font-mono text-sm"
              />
              <button
                onClick={handleCopyLink}
                className={`px-6 py-2 text-white rounded-md transition-colors font-medium ${
                  linkCopied
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {linkCopied ? (
                  <>
                    <FaCheck className="inline mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <FaCopy className="inline mr-2" />
                    Copy Link
                  </>
                )}
              </button>
            </div>

            {/* Advanced: Regenerate Link */}
            <div className="pt-2 border-t border-blue-200">
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                <FaRandom className="inline mr-1" />
                Regenerate link (invalidates old link)
              </button>
            </div>
          </div>
        </div>

        {/* Access Level Control */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Access Level
          </h4>
          <div className="space-y-2">
            {/* Private */}
            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="access-level"
                checked={accessLevel === "private"}
                onChange={() => handleAccessLevelChange("private")}
                className="mr-3 text-primary-600"
              />
              <div className="flex items-center flex-1">
                <FaUser className="text-gray-500 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Private</div>
                  <div className="text-sm text-gray-500">
                    Only you can access
                  </div>
                </div>
              </div>
            </label>

            {/* Link-Only */}
            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="access-level"
                checked={accessLevel === "link-only"}
                onChange={() => handleAccessLevelChange("link-only")}
                className="mr-3 text-primary-600"
              />
              <div className="flex items-center flex-1">
                <FaLink className="text-blue-500 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Link-Only</div>
                  <div className="text-sm text-gray-500">
                    Anyone with link (unlisted)
                  </div>
                </div>
              </div>
            </label>

            {/* Public */}
            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="access-level"
                checked={accessLevel === "public"}
                onChange={() => handleAccessLevelChange("public")}
                className="mr-3 text-primary-600"
              />
              <div className="flex items-center flex-1">
                <FaGlobe className="text-green-500 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Public</div>
                  <div className="text-sm text-gray-500">Anyone can access</div>
                </div>
              </div>
            </label>

            {/* Public + Password */}
            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="access-level"
                checked={accessLevel === "public-password"}
                onChange={() => handleAccessLevelChange("public-password")}
                className="mr-3 text-primary-600"
              />
              <div className="flex items-center flex-1">
                <FaKey className="text-amber-500 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">
                    Public + Password
                  </div>
                  <div className="text-sm text-gray-500">
                    Anyone with password
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Password Configuration - only shown when public-password is selected */}
        {accessLevel === "public-password" && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h5 className="text-sm font-medium text-gray-900 mb-3">
              Password Configuration
            </h5>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={sharingPassword}
                    onChange={(e) => setSharingPassword(e.target.value)}
                    placeholder="Enter a secure password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={generateSecurePassword}
                  className="px-3 py-2 text-sm text-amber-700 bg-amber-100 border border-amber-300 rounded-md hover:bg-amber-200 transition-colors"
                >
                  Generate
                </button>
              </div>

              {/* Password Strength Meter */}
              {sharingPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      Password strength
                    </span>
                    <span
                      className={`text-xs font-medium text-${passwordStrength.color}-600`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 bg-${passwordStrength.color}-500`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-amber-700">
                <FaInfoCircle className="inline mr-1" />
                Users must enter this password once per browser.
              </p>
            </div>
          </div>
        )}

        {/* Warning for private crates */}
        {accessLevel === "private" && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center text-yellow-800">
              <FaExclamationTriangle className="mr-2" />
              <span className="text-sm font-medium">
                This crate is private. Social sharing is disabled until you make
                it public.
              </span>
            </div>
          </div>
        )}

        {/* View Badge Section - Only shown when not private */}
        {accessLevel !== "private" && (
          <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              👁 View Counter Badge
            </h4>

            {/* Live Preview */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <img
                  src={`/api/crates/${crateId}/badge`}
                  alt="View counter badge"
                  className="inline-block"
                />
                <span className="text-sm text-gray-600">Live preview</span>
              </div>

              {/* Style Dropdown */}
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Style:
                </label>
                <select className="text-sm border border-gray-300 rounded px-2 py-1">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="mini">Mini</option>
                </select>
              </div>
            </div>

            {/* One-click Copy Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const markdown = `[![Views](https://mcph.io/api/crates/${crateId}/badge)](https://mcph.io/crate/${crateId})`;
                  navigator.clipboard.writeText(markdown);
                  setSocialLinkCopied(true);
                  setTimeout(() => setSocialLinkCopied(false), 2000);
                }}
                className="flex items-center justify-center px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                <FaCopy className="mr-2" />
                Copy Markdown
              </button>

              <button
                onClick={() => {
                  const html = `<a href="https://mcph.io/crate/${crateId}"><img src="https://mcph.io/api/crates/${crateId}/badge" alt="Views"></a>`;
                  navigator.clipboard.writeText(html);
                  setSocialLinkCopied(true);
                  setTimeout(() => setSocialLinkCopied(false), 2000);
                }}
                className="flex items-center justify-center px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                <FaCopy className="mr-2" />
                Copy HTML
              </button>
            </div>

            {/* UTM Tracking Option */}
            <div className="mt-3 pt-3 border-t border-orange-200">
              <label className="flex items-center text-sm text-gray-700">
                <input type="checkbox" className="mr-2" />
                Track referrals (adds UTM parameters)
              </label>
            </div>
          </div>
        )}

        {/* Social Sharing Section - Only shown when not private */}
        {accessLevel !== "private" && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Share on Social Media
            </h4>

            {/* Auto-generated message */}
            <div className="mb-4 p-3 bg-white border border-gray-300 rounded-md">
              <p className="text-sm text-gray-700">
                Check out this MCPH crate: <strong>{crateTitle}</strong>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {shareUrl.replace(
                  /^https?:\/\/localhost:\d+/,
                  "https://mcph.io",
                )}
              </p>
            </div>

            {/* Channel-specific copy buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const twitterText = `Check out this MCPH crate: ${crateTitle} ${shareUrl.replace(/^https?:\/\/localhost:\d+/, "https://mcph.io")}`;
                  navigator.clipboard.writeText(twitterText);
                  handleSocialShare("twitter");
                }}
                className="flex items-center justify-center px-3 py-2 border border-gray-200 rounded-lg transition-all hover:bg-blue-50 text-blue-500 hover:text-blue-600 hover:border-blue-300"
                title="Copy Twitter format"
              >
                <FaTwitter className="mr-2" />
                <span className="text-sm font-medium">Twitter</span>
              </button>

              <button
                onClick={() => {
                  const linkedinText = `Check out this MCPH crate: ${crateTitle}\n${shareUrl.replace(/^https?:\/\/localhost:\d+/, "https://mcph.io")}`;
                  navigator.clipboard.writeText(linkedinText);
                  handleSocialShare("linkedin");
                }}
                className="flex items-center justify-center px-3 py-2 border border-gray-200 rounded-lg transition-all hover:bg-blue-50 text-blue-700 hover:text-blue-800 hover:border-blue-300"
                title="Copy LinkedIn format"
              >
                <FaLinkedin className="mr-2" />
                <span className="text-sm font-medium">LinkedIn</span>
              </button>

              <button
                onClick={() => {
                  const redditText = `**${crateTitle}**\n\n${shareUrl.replace(/^https?:\/\/localhost:\d+/, "https://mcph.io")}`;
                  navigator.clipboard.writeText(redditText);
                  handleSocialShare("reddit");
                }}
                className="flex items-center justify-center px-3 py-2 border border-gray-200 rounded-lg transition-all hover:bg-orange-50 text-orange-500 hover:text-orange-600 hover:border-orange-300"
                title="Copy Reddit format"
              >
                <FaReddit className="mr-2" />
                <span className="text-sm font-medium">Reddit</span>
              </button>

              <button
                onClick={() => {
                  const markdownText = `[${crateTitle}](${shareUrl.replace(/^https?:\/\/localhost:\d+/, "https://mcph.io")})`;
                  navigator.clipboard.writeText(markdownText);
                  setSocialLinkCopied(true);
                  setTimeout(() => setSocialLinkCopied(false), 2000);
                }}
                className="flex items-center justify-center px-3 py-2 border border-gray-200 rounded-lg transition-all hover:bg-purple-50 text-purple-500 hover:text-purple-600 hover:border-purple-300"
                title="Copy Markdown format"
              >
                <FaLink className="mr-2" />
                <span className="text-sm font-medium">Markdown</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowSharingModal(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateSharing}
            disabled={
              sharingLoading ||
              (accessLevel === "public-password" && !sharingPassword)
            }
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
          >
            {sharingLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Updating...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

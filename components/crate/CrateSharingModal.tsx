"use client";

import React from "react";
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
} from "react-icons/fa";

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
}: CrateSharingModalProps) {
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

        <div className="space-y-4">
          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">Public Access</h4>
              <p className="text-sm text-gray-500">
                {isPublic
                  ? "Anyone with the link can view this crate"
                  : "Only you can access this crate"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                isPublic ? "bg-primary-600" : "bg-gray-200"
              }`}
              role="switch"
              aria-checked={isPublic}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isPublic ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Password Protection Toggle - only shown when public */}
          {isPublic && (
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  Password Protection
                </h4>
                <p className="text-sm text-gray-500">
                  {isPasswordProtected
                    ? "Viewers must enter a password to access"
                    : "No password required for access"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordProtected(!isPasswordProtected)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                  isPasswordProtected ? "bg-yellow-600" : "bg-gray-200"
                }`}
                role="switch"
                aria-checked={isPasswordProtected}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isPasswordProtected ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Password Input - only shown when password protection is enabled */}
          {isPublic && isPasswordProtected && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Set Password
              </label>
              <input
                type="password"
                value={sharingPassword}
                onChange={(e) => setSharingPassword(e.target.value)}
                placeholder="Enter a secure password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Choose a strong password to protect your crate
              </p>
            </div>
          )}
        </div>

        {isPublic && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Share URL
            </label>
            <div className="flex">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                }}
                className={`px-4 py-2 text-white rounded-r-md transition-colors ${
                  linkCopied
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-primary-600 hover:bg-primary-700"
                }`}
              >
                {linkCopied ? (
                  <>
                    <FaCheck className="inline mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <FaShareAlt className="inline mr-1" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-blue-600">
              <FaInfoCircle className="inline mr-1" />
              Anyone with this link can{" "}
              {isPasswordProtected
                ? "view your crate (with password)"
                : "view your crate"}
            </p>
          </div>
        )}

        {/* View Badge Section - Only shown when public */}
        {isPublic && (
          <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              📊 View Counter Badge
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Add a view counter badge to your README or blog posts to show how
              popular your crate is!
            </p>

            {/* Badge Preview */}
            <div className="mb-3">
              <img
                src={`/api/crates/${crateId}/badge`}
                alt="View counter badge"
                className="inline-block"
              />
            </div>

            {/* Markdown Code */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">
                Markdown:
              </label>
              <div className="relative">
                <code className="block text-xs bg-white p-2 rounded border text-gray-800 pr-8 font-mono">
                  [![Views](https://mcphub.com/api/crates/{crateId}
                  /badge)](https://mcphub.com/crate/{crateId})
                </code>
                <button
                  onClick={() => {
                    const markdown = `[![Views](https://mcphub.com/api/crates/${crateId}/badge)](https://mcphub.com/crate/${crateId})`;
                    navigator.clipboard.writeText(markdown);
                    setSocialLinkCopied(true);
                    setTimeout(() => setSocialLinkCopied(false), 2000);
                  }}
                  className="absolute right-1 top-1 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy markdown"
                >
                  <FaCopy className="text-xs" />
                </button>
              </div>
            </div>

            {/* HTML Code */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">HTML:</label>
              <div className="relative">
                <code className="block text-xs bg-white p-2 rounded border text-gray-800 pr-8 font-mono">
                  &lt;a href="https://mcphub.com/crate/{crateId}"&gt;&lt;img
                  src="https://mcphub.com/api/crates/{crateId}/badge"
                  alt="Views"&gt;&lt;/a&gt;
                </code>
                <button
                  onClick={() => {
                    const html = `<a href="https://mcphub.com/crate/${crateId}"><img src="https://mcphub.com/api/crates/${crateId}/badge" alt="Views"></a>`;
                    navigator.clipboard.writeText(html);
                    setSocialLinkCopied(true);
                    setTimeout(() => setSocialLinkCopied(false), 2000);
                  }}
                  className="absolute right-1 top-1 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy HTML"
                >
                  <FaCopy className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Social Sharing Section - Only shown when public */}
        {isPublic && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Share on Social Media
            </h4>

            {/* Custom Message Editor */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Customize Share Message
                <span className="text-gray-500 font-normal ml-1">
                  (Markdown supported)
                </span>
              </label>
              <textarea
                value={socialShareMessage}
                onChange={(e) => setSocialShareMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="**Bold text**, *italic text*, [link text](url), `code`..."
              />
              <p className="mt-1 text-xs text-gray-500">
                ✓ Discord: Copies formatted message • Reddit: Creates text post
                with title & body • LinkedIn: Opens share dialog + copies message
                for pasting • Twitter/Telegram/Email: Full support
              </p>
            </div>

            {/* Social Platform Buttons */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => handleSocialShare("twitter")}
                className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg transition-all hover:bg-blue-50 text-blue-500 hover:text-blue-600 hover:border-blue-300"
                title="Share on Twitter/X"
              >
                <FaTwitter className="mr-2 text-lg" />
                <span className="text-sm font-medium">Twitter/X</span>
              </button>

              <button
                onClick={() => handleSocialShare("reddit")}
                className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg transition-all hover:bg-orange-50 text-orange-500 hover:text-orange-600 hover:border-orange-300"
                title="Create Reddit text post with title and body"
              >
                <FaReddit className="mr-2 text-lg" />
                <span className="text-sm font-medium">Reddit</span>
              </button>

              <button
                onClick={() => handleSocialShare("linkedin")}
                className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg transition-all hover:bg-blue-50 text-blue-700 hover:text-blue-800 hover:border-blue-300"
                title="Open LinkedIn share dialog (copies message for manual pasting)"
              >
                <FaLinkedin className="mr-2 text-lg" />
                <span className="text-sm font-medium">LinkedIn</span>
              </button>

              <button
                onClick={() => handleSocialShare("discord")}
                className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg transition-all hover:bg-indigo-50 text-indigo-500 hover:text-indigo-600 hover:border-indigo-300"
                title="Copy formatted message to clipboard for Discord"
              >
                <FaDiscord className="mr-2 text-lg" />
                <span className="text-sm font-medium">Discord</span>
              </button>

              <button
                onClick={() => handleSocialShare("telegram")}
                className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg transition-all hover:bg-blue-50 text-blue-400 hover:text-blue-500 hover:border-blue-300"
                title="Share on Telegram"
              >
                <FaTelegram className="mr-2 text-lg" />
                <span className="text-sm font-medium">Telegram</span>
              </button>

              <button
                onClick={() => handleSocialShare("email")}
                className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg transition-all hover:bg-gray-50 text-gray-500 hover:text-gray-600 hover:border-gray-300"
                title="Share via Email"
              >
                <FaEnvelope className="mr-2 text-lg" />
                <span className="text-sm font-medium">Email</span>
              </button>
            </div>

            {/* Copy Link Button */}
            <button
              onClick={handleCopySocialLink}
              className={`w-full flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                socialLinkCopied
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {socialLinkCopied ? (
                <>
                  <FaCheck className="mr-2" />
                  Link Copied!
                </>
              ) : (
                <>
                  <FaLink className="mr-2" />
                  Copy Link
                </>
              )}
            </button>

            <p className="mt-2 text-xs text-gray-500">
              • <strong>Discord:</strong> Copies formatted message to clipboard
              <br />• <strong>Reddit:</strong> Creates text post with title &
              body
              <br />• <strong>LinkedIn:</strong> Opens share dialog + copies
              message for pasting
              <br />• <strong>Twitter/Telegram/Email:</strong> Opens with custom
              message
            </p>
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
              (isPasswordProtected && isPublic && !sharingPassword)
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
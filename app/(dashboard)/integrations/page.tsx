"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import { FaCopy, FaCheck, FaSpinner } from "react-icons/fa";
import { toast } from "react-hot-toast";

export default function IntegrationsPage() {
  const { user } = useAuth();
  const [isCopying, setIsCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Function to fetch Claude YAML config and copy to clipboard
  const handleCopyClaudeConfig = async () => {
    if (!user) return;
    
    setIsCopying(true);
    try {
      // Fetch the Claude integration config (which also rotates the API key)
      const token = await user.getIdToken();
      const response = await fetch('/api/integrations/claude', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get Claude configuration');
      }
      
      const configData = await response.json();
      
      // Convert the JSON to YAML format (simple conversion for this use case)
      const yamlConfig = `mcpServers:
  mcph:
    command: npx
    args:
      - -y
      - mcp-remote@latest
      - https://mcp.mcph.io/mcp
      - --header
      - Authorization: Bearer ${configData.mcpServers.mcph.args[4].split(' ')[1]}
      - --transport
      - http-only`;
      
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(yamlConfig);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
        
        // Show success toast
        toast.success("Config copied – paste into Claude → reload");
      } catch (clipboardError) {
        console.error("Error accessing clipboard:", clipboardError);
        toast.error("Failed to copy: Clipboard access denied");
      }
    } catch (error) {
      console.error("Error copying Claude config:", error);
      toast.error("Failed to copy configuration");
    } finally {
      setIsCopying(false);
    }
  };

  if (!user) {
    return <div className="text-center py-10">Please sign in to access integrations</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Integrations</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Claude Integration Card */}
        <Card hoverable>
          <Card.Header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <div className="flex items-center">
              <div className="mr-3">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="32" height="32" rx="6" fill="white" fillOpacity="0.2"/>
                  <path d="M7 16C7 11.0294 11.0294 7 16 7C20.9706 7 25 11.0294 25 16C25 20.9706 20.9706 25 16 25C11.0294 25 7 20.9706 7 16Z" stroke="white" strokeWidth="2"/>
                  <path d="M16 13V19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M13 16H19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Claude AI Integration</h2>
            </div>
          </Card.Header>
          <div className="p-6">
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Connect your account to Claude AI for enhanced MCP functionality.
              </p>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 flex-shrink-0">1</div>
                  <span className="text-gray-700">Copy configuration with secure API key</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 flex-shrink-0">2</div>
                  <span className="text-gray-700">Paste into Claude AI settings</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 flex-shrink-0">3</div>
                  <span className="text-gray-700">Reload Claude</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mb-6">
                <p className="text-amber-700 text-sm">
                  <strong>Security note:</strong> Each time you click the button below, your API key will be rotated for security.
                </p>
              </div>
            </div>
            
            <button
              onClick={handleCopyClaudeConfig}
              disabled={isCopying}
              className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
            >
              {isCopying ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : copied ? (
                <FaCheck className="mr-2" />
              ) : (
                <FaCopy className="mr-2" />
              )}
              {isCopying ? "Processing..." : copied ? "Copied!" : "Copy Configuration"}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Your API key appears in "My API keys" section
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

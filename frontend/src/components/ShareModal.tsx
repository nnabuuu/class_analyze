import React, { useState } from 'react';
import { X, Copy, Share2, Lock, Calendar, Download } from 'lucide-react';
import { ShareSettings } from '../types';
import { createShareLink } from '../api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, analysisId }) => {
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    url: `${window.location.origin}/shared/${analysisId}`,
    password: '',
    allowDownload: true,
  });
  
  const [copied, setCopied] = useState(false);
  const [expiryDays, setExpiryDays] = useState<number>(7);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareSettings.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setShareSettings(prev => ({ ...prev, password }));
  };

  const handleCreateShare = async () => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const finalSettings = {
      ...shareSettings,
      expiresAt: expiryDays > 0 ? expiresAt : undefined,
    };

    const res = await createShareLink(analysisId, finalSettings);
    if (res) {
      setShareSettings(prev => ({ ...prev, url: res.url }));
      alert('Share link created successfully!');
    } else {
      alert('Failed to create share link');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Share Analysis</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Share URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share URL
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={shareSettings.url}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={handleCopyUrl}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  copied 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copied && (
              <p className="text-sm text-green-600 mt-1">URL copied to clipboard!</p>
            )}
          </div>

          {/* Password Protection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password Protection (Optional)
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={shareSettings.password}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Leave empty for no password"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <button
                onClick={handleGeneratePassword}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Generate
              </button>
            </div>
          </div>

          {/* Expiry Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link Expiry
            </label>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value={1}>1 day</option>
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={0}>Never expires</option>
              </select>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Permissions
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={shareSettings.allowDownload}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, allowDownload: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex items-center space-x-1">
                  <Download className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Allow download</span>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateShare}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Create Share Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
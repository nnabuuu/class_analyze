import React, { useState } from 'react';
import { Download, Share2, FileText, FileSpreadsheet } from 'lucide-react';
import { ShareModal } from './ShareModal';
import { downloadFile } from '../api';

interface ReportActionsProps {
  analysisId: string;
  title: string;
}

export const ReportActions: React.FC<ReportActionsProps> = ({ analysisId, title }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (format: 'pdf' | 'excel') => {
    setIsDownloading(true);

    try {
      const blob = await downloadFile(analysisId, format);
      const fileName = `${title.replace(/\s+/g, '_')}_analysis.${
        format === 'pdf' ? 'pdf' : 'xlsx'
      }`;

      if (blob) {
        const url = URL.createObjectURL(blob);
        const element = document.createElement('a');
        element.href = url;
        element.download = fileName;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        URL.revokeObjectURL(url);
      } else {
        // Fallback mock download
        const element = document.createElement('a');
        element.href = '#';
        element.download = fileName;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="flex items-center space-x-3">
        {/* Download Dropdown */}
        <div className="relative group">
          <button
            disabled={isDownloading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
          </button>
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <div className="py-2">
              <button
                onClick={() => handleDownload('pdf')}
                disabled={isDownloading}
                className="flex items-center space-x-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <FileText className="w-4 h-4 text-red-500" />
                <span>Download as PDF</span>
              </button>
              <button
                onClick={() => handleDownload('excel')}
                disabled={isDownloading}
                className="flex items-center space-x-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                <span>Download as Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        analysisId={analysisId}
      />
    </>
  );
};
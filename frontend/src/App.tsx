import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { ProcessingContainer } from './components/ProcessingContainer';
import { ReportView } from './components/ReportView';
import { AudioFile } from './types';
import { mockAnalysisResult } from './data/mockData';

function App() {
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const handleFileSelect = (file: AudioFile) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setShowReport(false);
  };

  const handleProcessingComplete = () => {
    setIsProcessing(false);
    setShowReport(true);
  };

  const handleNewAnalysis = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setShowReport(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Class Audio Analyzer
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your class audio or transcript to get detailed analysis of learning activities, 
            BLOOM taxonomy levels, and student engagement patterns.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto space-y-6">
          {!selectedFile && !showReport && (
            <FileUpload onFileSelect={handleFileSelect} />
          )}

          {selectedFile && (
            <ProcessingContainer
              isProcessing={isProcessing}
              onComplete={handleProcessingComplete}
            />
          )}

          {showReport && (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">Analysis Results</h2>
                <button
                  onClick={handleNewAnalysis}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  New Analysis
                </button>
              </div>
              <ReportView analysisResult={mockAnalysisResult} />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>Powered by advanced AI analysis • Secure processing • Educational insights</p>
        </div>
      </div>
    </div>
  );
}

export default App;
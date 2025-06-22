import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { ProcessingContainer } from './components/ProcessingContainer';
import { ReportView } from './components/ReportView';
import {
  AudioFile,
  AnalysisResult,
  ClassTask,
  ConversationEvent,
  ClassInfo,
} from './types';
import { uploadFile, fetchResult } from './api';

interface BackendSentence {
  start: number;
  end: number;
  text: string;
  speaker_probabilities: { teacher: number; student: number };
}

interface BackendEvent {
  event_type: string;
  summary: string;
  sentences: BackendSentence[];
}

interface BackendTask {
  task_title: string;
  summary?: string;
  events: BackendEvent[];
}

interface BackendResult {
  tasks: BackendTask[];
  classInfo: ClassInfo;
  bloom?: any;
}

function transformResult(id: string, data: BackendResult): AnalysisResult {
  const tasks: ClassTask[] = data.tasks.map((task, tIdx) => {
    let start = Infinity;
    let end = 0;
    const events: ConversationEvent[] = [];
    task.events.forEach((ev) => {
      ev.sentences.forEach((s, idx) => {
        if (s.start < start) start = s.start;
        if (s.end > end) end = s.end;
        const role =
          (s.speaker_probabilities?.teacher ?? 0) >=
          (s.speaker_probabilities?.student ?? 0)
            ? 'teacher'
            : 'student';
        events.push({
          id: `${tIdx}-${idx}-${events.length}`,
          role,
          text: s.text,
          startTime: s.start,
          endTime: s.end,
          confidence: Math.max(
            s.speaker_probabilities.teacher,
            s.speaker_probabilities.student,
          ),
        });
      });
    });
    return {
      id: `t${tIdx}`,
      name: task.task_title,
      description: task.summary || '',
      startTime: start === Infinity ? 0 : start,
      endTime: end,
      events,
    };
  });

  // attach bloom analysis if available
  if (data.bloom && Array.isArray(data.bloom.taskSummaries)) {
    data.bloom.taskSummaries.forEach((summary: any, idx: number) => {
      const target = tasks[idx];
      if (!target) return;
      target.bloomAnalysis = {
        level: summary.predominant_level || 'Remember',
        confidence: 1,
        description: summary.summary || '',
        keywords: [],
      };
    });
  }

  const duration = tasks.reduce((max, t) => Math.max(max, t.endTime), 0);

  return {
    id,
    title: 'Class Analysis',
    duration,
    classInfo: data.classInfo,
    tasks,
    deepAnalysis: {
      bloom: !!data.bloom,
      sentiment: false,
      engagement: false,
      participation: false,
    },
  };
}

function App() {
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const handleFileSelect = async (file: AudioFile) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setShowReport(false);

    const { taskId } = await uploadFile(file.file, file.type);
    setTaskId(taskId);
  };

  const handleProcessingComplete = async () => {
    setIsProcessing(false);

    if (taskId) {
      try {
        const result = await fetchResult(taskId);
        const analysis = transformResult(taskId, result);
        setAnalysis(analysis);
      } catch (err) {
        console.error('Failed to fetch result:', err);
      }
    }

    setShowReport(true);
  };

  const handleNewAnalysis = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setShowReport(false);
    setTaskId(null);
    setAnalysis(null);
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
              taskId={taskId}
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
              {analysis && <ReportView analysisResult={analysis} />}
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
import React, { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, CheckCircle, Clock, AlertCircle, Loader, Info, BarChart3, FileText, Brain } from 'lucide-react';
import { ProcessingStage, ProcessingDetails } from '../types';
import { streamProgress } from '../api';

interface ProcessingContainerProps {
  isProcessing: boolean;
  onComplete: () => void;
  taskId?: string | null;
}

export const ProcessingContainer: React.FC<ProcessingContainerProps> = ({
  isProcessing,
  onComplete,
  taskId,
}) => {
  const [stages, setStages] = useState<ProcessingStage[]>([
    { id: '1', name: 'File Processing', status: 'pending', progress: 0, logs: [], isExpanded: false },
    { id: '2', name: 'Audio Transcription', status: 'pending', progress: 0, logs: [], isExpanded: false },
    { id: '3', name: 'Class Information Detection', status: 'pending', progress: 0, logs: [], isExpanded: false },
    { id: '4', name: 'Task Segmentation', status: 'pending', progress: 0, logs: [], isExpanded: false },
    { id: '5', name: 'BLOOM Taxonomy Analysis', status: 'pending', progress: 0, logs: [], isExpanded: false },
    { id: '6', name: 'Engagement Analysis', status: 'pending', progress: 0, logs: [], isExpanded: false },
    { id: '7', name: 'Report Generation', status: 'pending', progress: 0, logs: [], isExpanded: false },
  ]);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(-1);

  const getStageIcon = (stageName: string) => {
    switch (stageName) {
      case 'File Processing':
        return <FileText className="w-4 h-4" />;
      case 'Audio Transcription':
        return <FileText className="w-4 h-4" />;
      case 'Class Information Detection':
        return <Info className="w-4 h-4" />;
      case 'Task Segmentation':
        return <BarChart3 className="w-4 h-4" />;
      case 'BLOOM Taxonomy Analysis':
        return <Brain className="w-4 h-4" />;
      case 'Engagement Analysis':
        return <BarChart3 className="w-4 h-4" />;
      case 'Report Generation':
        return <FileText className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getStageSpecificDetails = (stageName: string, progress: number): ProcessingDetails => {
    const baseDetails: ProcessingDetails = {
      totalSteps: 5,
      currentStepIndex: Math.floor(progress / 20),
      estimatedTimeRemaining: Math.max(0, (100 - progress) * 0.1),
    };

    switch (stageName) {
      case 'File Processing':
        return {
          ...baseDetails,
          currentStep: progress <= 20 ? 'Validating file format' : 
                     progress <= 40 ? 'Extracting metadata' :
                     progress <= 60 ? 'Processing timestamps' :
                     progress <= 80 ? 'Preparing data structure' : 'Finalizing',
          intermediateResults: {
            fileSize: '2.4 MB',
            duration: '5:23',
            format: 'MP3',
            sampleRate: '44.1 kHz'
          }
        };
      
      case 'Audio Transcription':
        return {
          ...baseDetails,
          currentStep: progress <= 20 ? 'Initializing speech engine' :
                     progress <= 40 ? 'Processing audio segments' :
                     progress <= 60 ? 'Converting speech to text' :
                     progress <= 80 ? 'Applying timestamps' : 'Cleaning transcript',
          intermediateResults: {
            wordsTranscribed: Math.floor((progress / 100) * 847),
            totalWords: 847,
            speakers: 4,
            confidence: '92%'
          }
        };

      case 'Class Information Detection':
        return {
          ...baseDetails,
          currentStep: progress <= 20 ? 'Analyzing content patterns' :
                     progress <= 40 ? 'Identifying subject matter' :
                     progress <= 60 ? 'Detecting education level' :
                     progress <= 80 ? 'Extracting objectives' : 'Mapping curriculum',
          intermediateResults: {
            subjectConfidence: '91%',
            levelDetected: 'Middle School',
            keywordsFound: Math.floor((progress / 100) * 23),
            curriculumMatch: 'Science Standards'
          }
        };

      case 'Task Segmentation':
        return {
          ...baseDetails,
          currentStep: progress <= 20 ? 'Identifying conversation boundaries' :
                     progress <= 40 ? 'Detecting activity transitions' :
                     progress <= 60 ? 'Grouping related segments' :
                     progress <= 80 ? 'Classifying task types' : 'Validating segments',
          intermediateResults: {
            tasksIdentified: Math.floor((progress / 100) * 3),
            totalSegments: 12,
            averageTaskLength: '1:47',
            transitionPoints: 8
          }
        };

      case 'BLOOM Taxonomy Analysis':
        return {
          ...baseDetails,
          currentStep: progress <= 20 ? 'Analyzing cognitive complexity' :
                     progress <= 40 ? 'Mapping to BLOOM levels' :
                     progress <= 60 ? 'Calculating confidence scores' :
                     progress <= 80 ? 'Extracting key indicators' : 'Generating insights',
          intermediateResults: {
            tasksAnalyzed: Math.floor((progress / 100) * 3),
            bloomLevelsFound: ['Remember', 'Understand', 'Create'],
            averageComplexity: 'Moderate',
            keywordMatches: Math.floor((progress / 100) * 15)
          }
        };

      case 'Engagement Analysis':
        return {
          ...baseDetails,
          currentStep: progress <= 20 ? 'Measuring participation patterns' :
                     progress <= 40 ? 'Analyzing sentiment indicators' :
                     progress <= 60 ? 'Calculating engagement metrics' :
                     progress <= 80 ? 'Identifying interaction patterns' : 'Generating scores',
          intermediateResults: {
            participationRate: `${Math.floor((progress / 100) * 78)}%`,
            sentimentScore: 'Positive',
            interactionCount: Math.floor((progress / 100) * 24),
            engagementLevel: 'High'
          }
        };

      case 'Report Generation':
        return {
          ...baseDetails,
          currentStep: progress <= 20 ? 'Compiling analysis results' :
                     progress <= 40 ? 'Generating visualizations' :
                     progress <= 60 ? 'Creating summary statistics' :
                     progress <= 80 ? 'Formatting report sections' : 'Finalizing output',
          intermediateResults: {
            sectionsGenerated: Math.floor((progress / 100) * 6),
            totalSections: 6,
            chartsCreated: Math.floor((progress / 100) * 4),
            dataPointsProcessed: Math.floor((progress / 100) * 156)
          }
        };

      default:
        return baseDetails;
    }
  };

  const getStageSpecificLogs = (stageName: string, progress: number) => {
    const logs: string[] = [];
    
    switch (stageName) {
      case 'File Processing':
        if (progress === 20) logs.push('✓ File format validated successfully');
        if (progress === 40) logs.push('✓ Metadata extracted: 2.4MB MP3, 5:23 duration');
        if (progress === 60) logs.push('✓ Timestamp information processed');
        if (progress === 80) logs.push('✓ Data structure prepared for analysis');
        break;
      case 'Audio Transcription':
        if (progress === 20) logs.push('✓ Speech recognition engine initialized');
        if (progress === 40) logs.push('✓ Audio segmented into 12 chunks');
        if (progress === 60) logs.push('✓ 847 words transcribed with 92% confidence');
        if (progress === 80) logs.push('✓ Timestamps aligned with transcript');
        break;
      case 'Class Information Detection':
        if (progress === 20) logs.push('✓ Content patterns analyzed');
        if (progress === 40) logs.push('✓ Subject identified: Biology (91% confidence)');
        if (progress === 60) logs.push('✓ Education level detected: Middle School');
        if (progress === 80) logs.push('✓ 5 knowledge points extracted');
        break;
      case 'Task Segmentation':
        if (progress === 20) logs.push('✓ 8 conversation boundaries identified');
        if (progress === 40) logs.push('✓ Activity transitions detected');
        if (progress === 60) logs.push('✓ Content grouped into 3 main tasks');
        if (progress === 80) logs.push('✓ Task types classified successfully');
        break;
      case 'BLOOM Taxonomy Analysis':
        if (progress === 20) logs.push('✓ Cognitive complexity patterns identified');
        if (progress === 40) logs.push('✓ Tasks mapped to BLOOM levels');
        if (progress === 60) logs.push('✓ Confidence scores calculated');
        if (progress === 80) logs.push('✓ 15 key indicators extracted');
        break;
      case 'Engagement Analysis':
        if (progress === 20) logs.push('✓ Participation patterns measured');
        if (progress === 40) logs.push('✓ Sentiment analysis completed');
        if (progress === 60) logs.push('✓ Engagement metrics calculated');
        if (progress === 80) logs.push('✓ 24 interaction events analyzed');
        break;
      case 'Report Generation':
        if (progress === 20) logs.push('✓ Analysis results compiled');
        if (progress === 40) logs.push('✓ 4 visualizations generated');
        if (progress === 60) logs.push('✓ Summary statistics created');
        if (progress === 80) logs.push('✓ Report sections formatted');
        break;
      default:
        if (progress === 20) logs.push(`✓ Starting ${stageName.toLowerCase()}...`);
        if (progress === 40) logs.push(`✓ Processing data...`);
        if (progress === 60) logs.push(`✓ Analyzing results...`);
        if (progress === 80) logs.push(`✓ Finalizing output...`);
    }
    
    if (progress === 100) logs.push(`✅ ${stageName} completed successfully`);
    return logs;
  };

  const toggleStageExpansion = (stageId: string) => {
    setStages(prev => prev.map(stage => 
      stage.id === stageId 
        ? { ...stage, isExpanded: !stage.isExpanded }
        : stage
    ));
  };

  useEffect(() => {
    if (!isProcessing) return;

    let es: EventSource | null = null;
    if (taskId && taskId !== 'mock-task') {
      es = streamProgress(taskId, (data) => {
        console.log('Progress event', data);
      });
    }

    const processStages = async () => {
      for (let i = 0; i < stages.length; i++) {
        setCurrentStageIndex(i);
        
        // Expand current stage and collapse others
        setStages(prev => prev.map((stage, idx) => ({
          ...stage,
          status: idx === i ? 'processing' : stage.status,
          startTime: idx === i ? Date.now() : stage.startTime,
          isExpanded: idx === i ? true : (stage.status === 'completed' ? false : stage.isExpanded)
        })));

        // Simulate processing with progress updates
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 400));
          
          setStages(prev => prev.map((stage, idx) => {
            if (idx === i) {
              const newLogs = [...stage.logs];
              const stageSpecificLogs = getStageSpecificLogs(stage.name, progress);
              newLogs.push(...stageSpecificLogs);
              
              const details = getStageSpecificDetails(stage.name, progress);
              
              return { 
                ...stage, 
                progress, 
                logs: newLogs,
                details
              };
            }
            return stage;
          }));
        }

        // Complete stage and auto-fold after a brief delay
        setStages(prev => prev.map((stage, idx) => 
          idx === i ? { 
            ...stage, 
            status: 'completed', 
            endTime: Date.now(),
            isExpanded: true // Keep expanded briefly to show completion
          } : stage
        ));

        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Auto-fold completed stage
        setStages(prev => prev.map((stage, idx) => 
          idx === i ? { ...stage, isExpanded: false } : stage
        ));

        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setCurrentStageIndex(-1);
      setTimeout(() => {
        setIsCollapsed(true);
        onComplete();
      }, 1000);
    };

    processStages();

    return () => {
      if (es) es.close();
    };
  }, [isProcessing, onComplete, taskId]);

  const getStatusIcon = (status: ProcessingStage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const completedStages = stages.filter(s => s.status === 'completed').length;
  const totalStages = stages.length;

  if (!isProcessing && completedStages === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {completedStages === totalStages ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <Loader className="w-6 h-6 text-blue-500 animate-spin" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Analysis Processing</h3>
            <p className="text-sm text-gray-600">
              {completedStages === totalStages 
                ? 'Analysis completed successfully' 
                : `Processing stage ${currentStageIndex + 1} of ${totalStages}`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm font-medium text-gray-600">
            {completedStages}/{totalStages}
          </div>
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
          {stages.map((stage, index) => (
            <div key={stage.id} className={`border rounded-lg transition-all ${
              stage.status === 'processing' ? 'border-blue-300 bg-blue-50' : 
              stage.status === 'completed' ? 'border-green-200 bg-green-50' : 
              'border-gray-200 bg-gray-50'
            }`}>
              <div 
                className="flex items-center justify-between p-3 cursor-pointer"
                onClick={() => toggleStageExpansion(stage.id)}
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(stage.status)}
                  <div className="text-gray-500">
                    {getStageIcon(stage.name)}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">{stage.name}</span>
                    {stage.details?.currentStep && stage.status === 'processing' && (
                      <p className="text-xs text-gray-600 mt-1">{stage.details.currentStep}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">{stage.progress}%</span>
                  {stage.isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              
              {stage.status === 'processing' && (
                <div className="px-3 pb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stage.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {stage.isExpanded && (
                <div className="px-3 pb-3 space-y-3">
                  {/* Detailed Information */}
                  {stage.details?.intermediateResults && (
                    <div className="bg-white p-3 rounded border">
                      <h5 className="text-xs font-medium text-gray-700 mb-2">Current Progress</h5>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(stage.details.intermediateResults).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="font-medium text-gray-900">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Processing Steps */}
                  {stage.details?.totalSteps && stage.status === 'processing' && (
                    <div className="bg-white p-3 rounded border">
                      <h5 className="text-xs font-medium text-gray-700 mb-2">Processing Steps</h5>
                      <div className="flex space-x-1">
                        {Array.from({ length: stage.details.totalSteps }, (_, i) => (
                          <div
                            key={i}
                            className={`flex-1 h-2 rounded ${
                              i < (stage.details?.currentStepIndex || 0) ? 'bg-blue-500' :
                              i === (stage.details?.currentStepIndex || 0) ? 'bg-blue-300' :
                              'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      {stage.details.estimatedTimeRemaining && stage.details.estimatedTimeRemaining > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Est. {Math.ceil(stage.details.estimatedTimeRemaining)}s remaining
                        </p>
                      )}
                    </div>
                  )}

                  {/* Logs */}
                  {stage.logs.length > 0 && (
                    <div className="bg-white rounded border max-h-32 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {stage.logs.slice(-5).map((log, logIndex) => (
                          <div key={logIndex} className="text-xs text-gray-700 font-mono">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
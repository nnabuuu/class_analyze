import React, { useState } from "react";
import { AnalysisResult, ClassTask } from "../types";
import { AudioPlayer } from "./AudioPlayer";
import { TaskItem } from "./TaskItem";
import { AnalysisControls } from "./AnalysisControls";
import { ClassInfoCard } from "./ClassInfoCard";
import { ReportActions } from "./ReportActions";

interface ReportViewProps {
  analysisResult: AnalysisResult;
}

export const ReportView: React.FC<ReportViewProps> = ({ analysisResult }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>();
  const [analysisControls, setAnalysisControls] = useState<
    Record<string, boolean>
  >(analysisResult.deepAnalysis);

  const handleTaskSelect = (task: ClassTask) => {
    setSelectedTaskId(task.id);
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Class Analysis Report</h2>
            <p className="text-blue-100">
              Analysis completed for {analysisResult.title} • Duration:{" "}
              {Math.floor(analysisResult.duration / 60)}:
              {String(analysisResult.duration % 60).padStart(2, "0")}
            </p>
            <div className="flex space-x-6 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {analysisResult.tasks.length}
                </div>
                <div className="text-sm text-blue-200">Tasks Identified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {analysisResult.tasks.reduce(
                    (sum, task) => sum + task.events.length,
                    0,
                  )}
                </div>
                <div className="text-sm text-blue-200">Conversation Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {analysisResult.tasks.filter((t) => t.bloomAnalysis).length}
                </div>
                <div className="text-sm text-blue-200">BLOOM Analyzed</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="ml-6">
            <ReportActions
              analysisId={analysisResult.id}
              title={analysisResult.title}
            />
          </div>
        </div>
      </div>

      {/* Class Information */}
      <ClassInfoCard classInfo={analysisResult.classInfo} />

      {/* Audio Player */}
      <AudioPlayer
        tasks={analysisResult.tasks}
        onTaskSelect={handleTaskSelect}
        selectedTaskId={selectedTaskId}
      />

      {/* Analysis Controls */}
      <AnalysisControls
        controls={analysisControls}
        onChange={setAnalysisControls}
      />

      {/* Tasks List */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Class Tasks & Events
        </h3>
        <div className="space-y-4">
          {analysisResult.tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              showBloomAnalysis={analysisControls["bloom"]}
              onTaskClick={handleTaskSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

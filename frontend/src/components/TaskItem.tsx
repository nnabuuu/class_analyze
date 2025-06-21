import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, MessageCircle } from 'lucide-react';
import { ClassTask, ConversationEvent } from '../types';
import { EventItem } from './EventItem';

interface TaskItemProps {
  task: ClassTask;
  isSelected: boolean;
  showBloomAnalysis: boolean;
  onTaskClick: (task: ClassTask) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  isSelected, 
  showBloomAnalysis, 
  onTaskClick 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBloomColor = (level: string) => {
    const colors = {
      'Remember': 'text-gray-600 bg-gray-100',
      'Understand': 'text-blue-600 bg-blue-100',
      'Apply': 'text-green-600 bg-green-100',
      'Analyze': 'text-yellow-600 bg-yellow-100',
      'Evaluate': 'text-orange-600 bg-orange-100',
      'Create': 'text-purple-600 bg-purple-100',
    };
    return colors[level as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div 
      className={`border rounded-lg transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
      }`}
    >
      <div 
        className="p-4 cursor-pointer"
        onClick={() => {
          onTaskClick(task);
          setIsExpanded(!isExpanded);
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button className="text-gray-400 hover:text-gray-600">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <div>
              <h4 className="font-medium text-gray-900">{task.name}</h4>
              <p className="text-sm text-gray-600">{task.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatTime(task.startTime)} - {formatTime(task.endTime)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{task.events.length}</span>
            </div>
          </div>
        </div>

        {showBloomAnalysis && task.bloomAnalysis && (
          <div className="mt-3 flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getBloomColor(task.bloomAnalysis.level)}`}>
              {task.bloomAnalysis.level}
            </div>
            <div className="text-sm text-gray-600">
              Confidence: {Math.round(task.bloomAnalysis.confidence * 100)}%
            </div>
            <div className="flex space-x-1">
              {task.bloomAnalysis.keywords.map((keyword, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          <h5 className="font-medium text-gray-700 mb-3">Conversation Events</h5>
          <div className="space-y-2">
            {task.events.map((event) => (
              <EventItem key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
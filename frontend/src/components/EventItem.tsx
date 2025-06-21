import React, { useState } from 'react';
import { ChevronDown, ChevronRight, User, GraduationCap, Settings } from 'lucide-react';
import { ConversationEvent } from '../types';

interface EventItemProps {
  event: ConversationEvent;
}

export const EventItem: React.FC<EventItemProps> = ({ event }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'teacher':
        return <GraduationCap className="w-4 h-4" />;
      case 'student':
        return <User className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'teacher':
        return 'text-blue-600 bg-blue-100';
      case 'student':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const duration = event.endTime - event.startTime;
  const preview = event.text.length > 100 ? event.text.substring(0, 100) + '...' : event.text;

  return (
    <div className="border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div 
        className="p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button className="text-gray-400 hover:text-gray-600">
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(event.role)}`}>
              {getRoleIcon(event.role)}
              <span className="capitalize">{event.role}</span>
            </div>
            
            <div className="text-sm text-gray-600">
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </div>
            
            <div className="text-xs text-gray-500">
              ({duration}s)
            </div>
          </div>
          
          {event.confidence && (
            <div className="text-xs text-gray-500">
              {Math.round(event.confidence * 100)}% confidence
            </div>
          )}
        </div>
        
        {!isExpanded && (
          <div className="mt-2 text-sm text-gray-700 ml-6">
            {preview}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="px-6 pb-4">
          <div className="bg-white p-3 rounded border text-sm text-gray-800 leading-relaxed">
            {event.text}
          </div>
        </div>
      )}
    </div>
  );
};
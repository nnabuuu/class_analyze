import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { ClassTask } from '../types';

interface AudioPlayerProps {
  tasks: ClassTask[];
  onTaskSelect: (task: ClassTask) => void;
  selectedTaskId?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  tasks, 
  onTaskSelect, 
  selectedTaskId 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(300); // 5 minutes default
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    setCurrentTime(newTime);
  };

  const handleTaskClick = (task: ClassTask) => {
    setCurrentTime(task.startTime);
    onTaskSelect(task);
  };

  const getTaskColor = (taskId: string, index: number) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'
    ];
    return selectedTaskId === taskId 
      ? 'bg-red-500' 
      : colors[index % colors.length];
  };

  // Simulate audio progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Audio Timeline</h3>
      
      {/* Timeline Visualization */}
      <div className="mb-6">
        <div 
          className="relative h-16 bg-gray-100 rounded-lg cursor-pointer overflow-hidden"
          onClick={handleTimelineClick}
        >
          {/* Task segments */}
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className={`absolute top-2 bottom-2 ${getTaskColor(task.id, index)} opacity-70 hover:opacity-90 rounded transition-opacity cursor-pointer`}
              style={{
                left: `${(task.startTime / duration) * 100}%`,
                width: `${((task.endTime - task.startTime) / duration) * 100}%`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleTaskClick(task);
              }}
              title={task.name}
            />
          ))}
          
          {/* Progress indicator */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-red-500 z-10"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
          
          {/* Time markers */}
          <div className="absolute bottom-1 left-2 text-xs text-gray-600">
            {formatTime(0)}
          </div>
          <div className="absolute bottom-1 right-2 text-xs text-gray-600">
            {formatTime(duration)}
          </div>
        </div>
        
        {/* Current time display */}
        <div className="flex justify-center mt-2">
          <span className="text-sm font-medium text-gray-700">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4 mb-4">
        <button className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
          <SkipBack className="w-5 h-5" />
        </button>
        
        <button
          onClick={handlePlayPause}
          className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </button>
        
        <button className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center justify-center space-x-2">
        <Volume2 className="w-4 h-4 text-gray-500" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Task Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Tasks:</h4>
        <div className="flex flex-wrap gap-2">
          {tasks.map((task, index) => (
            <button
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getTaskColor(task.id, index)} hover:opacity-80 transition-opacity`}
            >
              {task.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
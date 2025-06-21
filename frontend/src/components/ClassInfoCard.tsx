import React from 'react';
import { BookOpen, GraduationCap, Target, Award } from 'lucide-react';
import { ClassInfo } from '../types';

interface ClassInfoCardProps {
  classInfo: ClassInfo;
}

export const ClassInfoCard: React.FC<ClassInfoCardProps> = ({ classInfo }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Class Information</h3>
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <Award className="w-4 h-4" />
          <span>{Math.round(classInfo.confidence * 100)}% confidence</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subject and Level */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Subject</p>
              <p className="font-medium text-gray-900">{classInfo.subject}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Educational Level</p>
              <p className="font-medium text-gray-900">{classInfo.level}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">Curriculum</p>
              <p className="font-medium text-gray-900">{classInfo.curriculum}</p>
            </div>
          </div>
        </div>

        {/* Knowledge Points and Objectives */}
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 mb-2">Knowledge Points</p>
            <div className="flex flex-wrap gap-1">
              {classInfo.knowledgePoints.map((point, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {point}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Teaching Objectives</p>
            <div className="space-y-1">
              {classInfo.teachingObjectives.map((objective, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{objective}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
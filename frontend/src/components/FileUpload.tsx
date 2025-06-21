import React, { useCallback, useState } from 'react';
import { Upload, FileAudio, FileText, X } from 'lucide-react';
import { AudioFile } from '../types';

interface FileUploadProps {
  onFileSelect: (file: AudioFile) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || !e.target.files) return;
    
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  }, [disabled]);

  const processFile = (file: File) => {
    const isAudio = file.type.startsWith('audio/');
    const isText = file.type === 'text/plain' || file.name.endsWith('.txt');
    
    if (!isAudio && !isText) {
      alert('Please select an audio file or text transcript file.');
      return;
    }

    const audioFile: AudioFile = {
      file,
      type: isAudio ? 'audio' : 'transcript'
    };

    setSelectedFile(audioFile);
    onFileSelect(audioFile);
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  if (selectedFile) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {selectedFile.type === 'audio' ? (
              <FileAudio className="w-8 h-8 text-blue-500" />
            ) : (
              <FileText className="w-8 h-8 text-green-500" />
            )}
            <div>
              <p className="font-medium text-gray-900">{selectedFile.file.name}</p>
              <p className="text-sm text-gray-500">
                {selectedFile.type === 'audio' ? 'Audio File' : 'Transcript File'} • 
                {(selectedFile.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={removeFile}
            className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
            disabled={disabled}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
        dragActive
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="audio/*,.txt"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={disabled}
      />
      
      <div className="text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Audio or Transcript
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Drag and drop your file here, or click to browse
        </p>
        <div className="flex justify-center space-x-4 text-xs text-gray-400">
          <span className="flex items-center">
            <FileAudio className="w-4 h-4 mr-1" />
            Audio files
          </span>
          <span className="flex items-center">
            <FileText className="w-4 h-4 mr-1" />
            Transcript (.txt)
          </span>
        </div>
      </div>
    </div>
  );
};
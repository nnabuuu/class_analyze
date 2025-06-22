import React, { useEffect, useState } from "react";
import { Brain, Heart, Users, BarChart3 } from "lucide-react";
import { fetchDeepItems } from "../api";

interface AnalysisControlsProps {
  controls: Record<string, boolean>;
  onChange: (controls: Record<string, boolean>) => void;
}

export const AnalysisControls: React.FC<AnalysisControlsProps> = ({
  controls,
  onChange,
}) => {
  const [available, setAvailable] = useState<string[]>([]);

  useEffect(() => {
    fetchDeepItems()
      .then((items) => setAvailable(items.map((i) => i.name)))
      .catch(() => setAvailable([]));
  }, []);
  const handleToggle = (key: string) => {
    onChange({
      ...controls,
      [key]: !controls[key],
    });
  };

  const itemDetails: Record<
    string,
    {
      label: string;
      description: string;
      icon: any;
      color: string;
    }
  > = {
    bloom: {
      label: "BLOOM Taxonomy",
      description: "Cognitive learning levels analysis",
      icon: Brain,
      color: "text-purple-600 bg-purple-100 border-purple-200",
    },
    sentiment: {
      label: "Sentiment Analysis",
      description: "Emotional tone and engagement",
      icon: Heart,
      color: "text-pink-600 bg-pink-100 border-pink-200",
    },
    engagement: {
      label: "Engagement Level",
      description: "Student participation metrics",
      icon: BarChart3,
      color: "text-green-600 bg-green-100 border-green-200",
    },
    participation: {
      label: "Participation Pattern",
      description: "Speaking time and turn-taking",
      icon: Users,
      color: "text-blue-600 bg-blue-100 border-blue-200",
    },
  };

  const analysisTypes = available
    .map((name) => ({ key: name, ...itemDetails[name] }))
    .filter((i) => i.label);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Deep Analysis Controls
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysisTypes.map((analysis) => {
          const Icon = analysis.icon;
          const isActive = controls[analysis.key];

          return (
            <div
              key={analysis.key}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                isActive
                  ? analysis.color + " shadow-md"
                  : "border-gray-200 hover:border-gray-300 bg-gray-50"
              }`}
              onClick={() => handleToggle(analysis.key)}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`p-2 rounded-lg ${isActive ? "bg-white" : "bg-gray-200"}`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? analysis.color.split(" ")[0] : "text-gray-500"}`}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      {analysis.label}
                    </h4>
                    <div
                      className={`w-4 h-4 border-2 rounded ${
                        isActive
                          ? "bg-current border-current"
                          : "border-gray-300"
                      }`}
                    >
                      {isActive && (
                        <svg
                          viewBox="0 0 16 16"
                          className="w-full h-full text-white fill-current"
                        >
                          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {analysis.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

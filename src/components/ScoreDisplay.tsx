import React from "react";

interface ScoreDisplayProps {
  score: number;
  label: string;
  description?: string;
  icon?: React.ElementType;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  label,
  description,
  icon: Icon,
}) => {
  return (
    <div className="flex flex-col items-center p-6 bg-card rounded-lg border transition-all hover:shadow-md">
      {Icon && <Icon className="h-8 w-8 mb-4 text-primary" />}
      <div className="text-4xl font-bold mb-2">{score}</div>
      <div className="text-sm font-medium">{label}</div>
      {description && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {description}
        </p>
      )}
    </div>
  );
};

import React, { FC } from 'react';
import { PasswordStrength } from '@/hooks/form/usePasswordStrength';

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
  strengthLevel: number;
  visible: boolean;
}

export const PasswordStrengthIndicator: FC<PasswordStrengthIndicatorProps> = ({
  strength,
  strengthLevel,
  visible,
}) => {
  if (!visible) return null;
  
  return (
    <div className="space-y-2 mt-2 transition-opacity duration-200" 
         style={{ opacity: visible ? 1 : 0 }}>
      <div className="flex gap-1">
        <div className="h-1 flex-1 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              strengthLevel >= 1 ? "bg-green-500" : "bg-gray-200"
            }`}
          />
        </div>
        <div className="h-1 flex-1 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              strengthLevel >= 2 ? "bg-green-500" : "bg-gray-200"
            }`}
          />
        </div>
        <div className="h-1 flex-1 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              strengthLevel >= 3 ? "bg-green-500" : "bg-gray-200"
            }`}
          />
        </div>
      </div>
      <ul className="text-xs space-y-1 text-muted-foreground">
        <li className={strength.hasLength ? "text-green-500" : ""}>
          • At least 8 characters
        </li>
        <li className={strength.hasNumber ? "text-green-500" : ""}>
          • At least one number
        </li>
        <li className={strength.hasSpecial ? "text-green-500" : ""}>
          • At least one special character
        </li>
      </ul>
    </div>
  );
}; 
import { useState, useCallback, useMemo } from 'react';

export type PasswordStrength = {
  hasLength: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
};

export const usePasswordStrength = (initialValue = '') => {
  const [password, setPassword] = useState(initialValue);
  
  const strength = useMemo<PasswordStrength>(() => ({
    hasLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }), [password]);
  
  const strengthLevel = useMemo(() => {
    return Object.values(strength).filter(Boolean).length;
  }, [strength]);
  
  const isStrong = useMemo(() => {
    return strengthLevel >= 3;
  }, [strengthLevel]);
  
  const updatePassword = useCallback((newPassword: string) => {
    setPassword(newPassword);
  }, []);
  
  return {
    password,
    strength,
    strengthLevel,
    isStrong,
    updatePassword,
  };
}; 
import { useState, useCallback } from 'react';
import { App } from 'antd';
import { getAPI } from '@/utils/api';
import { API } from 'common';

export const useTextToSpeech = () => {
  const { message } = App.useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const stopPlaying = useCallback(() => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      setAudio(null);
    }
  }, [audio]);

  const playText = useCallback(async (text: string) => {
    try {
      if (isPlaying) {
        stopPlaying();
        return;
      }

      // Set loading state with a slight delay to prevent flickering
      const loadingTimeout = setTimeout(() => {
        setIsLoading(true);
      }, 100);

      // Create speech request using our backend API with proper authentication
      const response = await getAPI().axios.post(API.textToSpeech.path, { text }, {
        responseType: 'blob',
      });

      if (!response.data) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = response.data;
      const audioUrl = URL.createObjectURL(audioBlob);
      const newAudio = new Audio(audioUrl);

      // Preload the audio
      await new Promise((resolve, reject) => {
        newAudio.preload = 'auto';
        newAudio.oncanplaythrough = resolve;
        newAudio.onerror = reject;
        newAudio.load();
      });

      // Clear the loading timeout if audio loaded quickly
      clearTimeout(loadingTimeout);
      
      newAudio.onended = () => {
        setIsPlaying(false);
        setAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      setAudio(newAudio);
      setIsPlaying(true);
      await newAudio.play();
    } catch (error) {
      console.error('Error playing text:', error);
      void message.error('Failed to play text. Please try again.');
      setIsPlaying(false);
      setAudio(null);
    } finally {
      // Add a small delay before removing loading state to prevent flickering
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  }, [isPlaying, stopPlaying, message]);

  return {
    isPlaying,
    isLoading,
    playText,
    stopPlaying,
  };
}; 
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { uploadDocument } from "@/storage";
import { useTranscribeAudioDocument } from "@/hooks/documents/useTranscribeAudioDocument";
import { App } from "antd";

export const useSpeechToText = () => {
  const { message } = App.useApp();
  const { mutateAsync: transcribeAudio, isLoading: isTranscribing } =
    useTranscribeAudioDocument();
  const [isListening, setIsListening] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isStreamingSupported, setIsStreamingSupported] = useState(false);
  const [error, setError] = useState<SpeechRecognitionErrorEvent>();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const transcribeWithApi = useCallback(
    async (file: File) => {
      try {
        setIsUploading(true);
        // upload to storage
        const path = await uploadDocument(file);

        const data = await transcribeAudio({ name: file.name, path });
        return data?.transcript ?? "";
      } catch (e) {
        throw e;
      } finally {
        setIsUploading(false);
      }
    },
    [transcribeAudio],
  );

  const fallback = useCallback(async () => {
    setIsListening(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    const current = mediaRecorderRef.current;

    const promise = new Promise<string>((resolve) => {
      current.onstop = async () => {
        // Stop all tracks immediately
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const file = new File([audioBlob], "recording.wav", {
          type: "audio/wav",
        });

        audioChunksRef.current = [];
        const result = await transcribeWithApi(file);
        resolve(result);
      };
    });

    mediaRecorderRef.current.start();

    return promise.catch(() => {
      void message.error("Could not transcribe audio, try again...");
    });
  }, [message, transcribeWithApi]);

  const startListening = useCallback(
    async (streamResult: (value: string) => void) => {
      if (recognitionRef.current) {
        setIsStreamingSupported(true);
        const current = recognitionRef.current;
        const promise = new Promise<string>((resolve) => {
          let stopped = false;
          current.onresult = (event) => {
            const resultArray = Array.from(event.results);
            const result = resultArray
              .map((results) => results[0].transcript)
              .join("");

            // result streams as user records
            streamResult(result);
            if (stopped) {
              resolve(result);
            }
          };

          current.onspeechend = async () => {
            stopped = true;
          }
        });
        recognitionRef.current.start();
        setIsListening(true);
        await promise;
      } else {
        setIsStreamingSupported(false);
        try {
          const result = await fallback();

          if (result) {
            // one off, no streams for api transcription
            streamResult(result);
          }
        } catch (e) {
          setIsListening(false);
          if (e instanceof DOMException) {
            if (e.name === "NotAllowedError") {
              void message.error("Microphone permission is required to use this service, try again");
            }
          }
        }
      }
    },
    [fallback, message],
  );

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onerror = (e) => {
          setIsListening(false);
          setError(e);
          let errorMessage = "Could not transcribe audio, try again";
          if (e instanceof SpeechRecognitionErrorEvent) {
            switch (e.error) {
              case "not-allowed":
              case "service-not-allowed":
                errorMessage = "Microphone permission is required to use this service, try again";
                break;
              case "no-speech":
                errorMessage = "No speech detected, try again";
                break;
              case "language-not-supported":
                errorMessage = "Language not supported";
                break;
            }
          }
          void message.error(errorMessage);
        };
      }
    }
  }, [fallback, message]);

  return {
    error,
    isListening,
    isStreamingSupported,
    isTranscribing: isTranscribing || isUploading,
    startListening,
    stopListening,
  };
};

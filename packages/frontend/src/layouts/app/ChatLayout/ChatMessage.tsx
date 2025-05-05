import { format } from "date-fns";
import { FunctionComponent, useMemo, useRef, useState, useCallback, useEffect } from "react";
import { twMerge } from "tailwind-merge";
import Markdown from "react-markdown";
import { ChatSchema } from "common";
import { uniqBy } from "lodash";
import { Tooltip } from "antd";
import { Brain, PlayCircle, StopCircle, Loader2 } from "lucide-react";
import { useTextToSpeech } from "@/hooks/chat/useTextToSpeech";

export type ChatMessageProps = {
  role: string;
  content: string;
  timestamp: string;
  className?: string;
  sources?: ChatSchema["messages"][number]["sources"];
  reasoningSummary?: string;
};

export const ChatMessage: FunctionComponent<ChatMessageProps> = ({
  role,
  content: contentWithCitations,
  timestamp,
  className,
  sources = [],
  reasoningSummary,
}) => {
  // Show reasoning icon when we have a summary for an assistant message
  const showReasoningIcon = role === 'assistant' && Boolean(reasoningSummary);
  const messageRef = useRef<HTMLDivElement>(null);
  const [tooltipPlacement, setTooltipPlacement] = useState<'bottomLeft' | 'topLeft'>('bottomLeft');
  const [isMobile, setIsMobile] = useState(false);
  const { isPlaying, playText, stopPlaying, isLoading } = useTextToSpeech();
  
  // Check if device is mobile
  const checkIfMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);
  
  // Determine if message is near bottom of viewport to adjust tooltip placement
  const updateTooltipPlacement = useCallback(() => {
    if (!messageRef.current) return;
    
    const rect = messageRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const distanceFromBottom = viewportHeight - rect.bottom;
    
    // If message is near bottom of viewport, show tooltip on top
    // Use a smaller threshold on mobile
    const threshold = isMobile ? 200 : 300;
    if (distanceFromBottom < threshold) {
      setTooltipPlacement('topLeft');
    } else {
      setTooltipPlacement('bottomLeft');
    }
  }, [isMobile]);
  
  // Update placement when component mounts and on resize
  useEffect(() => {
    checkIfMobile();
    updateTooltipPlacement();
    
    window.addEventListener('resize', checkIfMobile);
    window.addEventListener('resize', updateTooltipPlacement);
    window.addEventListener('scroll', updateTooltipPlacement);
    window.addEventListener('orientationchange', () => {
      checkIfMobile();
      updateTooltipPlacement();
    });
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
      window.removeEventListener('resize', updateTooltipPlacement);
      window.removeEventListener('scroll', updateTooltipPlacement);
      window.removeEventListener('orientationchange', updateTooltipPlacement);
    };
  }, [updateTooltipPlacement, checkIfMobile]);

  const content = useMemo(() => {
    return contentWithCitations.replace(/【[^】]*】/g, "");
  }, [contentWithCitations]);

  // Calculate responsive tooltip width based on screen size
  const getTooltipStyle = useMemo(() => {
    if (isMobile) {
      return {
        maxWidth: 'min(80vw, 270px)',
        minWidth: 'min(80vw, 250px)'
      };
    }
    return {
      maxWidth: '600px',
      minWidth: '300px'
    };
  }, [isMobile]);
  
  // Format reasoning content by parsing headings
  const formattedReasoningContent = useMemo(() => {
    if (!reasoningSummary) return [];
    
    return reasoningSummary.split('\n').map((line, index) => {
      // Check if line is a heading (starts and ends with **)
      const headingMatch = line.match(/^\*\*(.*?)\*\*$/);
      
      if (headingMatch) {
        // This is a heading - remove asterisks and make bold
        const headingText = headingMatch[1];
        return (
          <h3 
            key={index}
            style={{ 
              fontWeight: 600,
              fontSize: isMobile ? '14px' : '15px',
              marginTop: index === 0 ? '0' : '16px',
              marginBottom: '8px',
              color: '#000'
            }}
          >
            {headingText}
          </h3>
        );
      }
      
      // Regular paragraph
      return (
        <p 
          key={index} 
          style={{ 
            marginBottom: line ? (isMobile ? '6px' : '8px') : '0',
            marginTop: '0'
          }}
        >
          {line}
        </p>
      );
    });
  }, [reasoningSummary, isMobile]);

  const handlePlayClick = useCallback(() => {
    if (isPlaying) {
      stopPlaying();
    } else {
      void playText(contentWithCitations);
    }
  }, [isPlaying, stopPlaying, playText, contentWithCitations]);

  // Determine button state for smooth transitions
  const buttonState = useMemo(() => {
    if (isLoading) return 'loading';
    if (isPlaying) return 'playing';
    return 'ready';
  }, [isLoading, isPlaying]);

  return (
    <div
      ref={messageRef}
      className={twMerge(
        "bg-blue-100 p-3 rounded-lg max-w-[80%]",
        role == "user" && "ml-auto",
        role == "assistant" && "mr-auto bg-white border",
        role == "system" && "mr-auto bg-red-50 border border-dashed border-red-500",
        className,
      )}
    >
      <Markdown className="prose prose-sm">{content}</Markdown>
      {sources.length > 0 && (
        <div className="mt-4">
          <div className="font-bold">Sources</div>
          <ul>
            {uniqBy(sources, "filename").map(({ filename }, i) => (
              <li key={i}>- {filename}</li>
            ))}
          </ul>
        </div>
      )}
      {/* Brain icon, play button, and timestamp */}
      <div className="flex items-center justify-end space-x-1 mt-1">
        {showReasoningIcon && reasoningSummary && (
          <Tooltip 
            title={
              <div style={{ 
                maxWidth: '100%', 
                fontSize: isMobile ? '13px' : '14px', 
                lineHeight: '1.6',
                padding: isMobile ? '10px' : '12px',
                maxHeight: isMobile ? '350px' : '300px',
                overflowY: 'auto',
                overflowX: 'hidden',
                /* Custom scrollbar styling */
                scrollbarWidth: 'thin',
                scrollbarColor: '#d4d4d8 transparent'
              }}>
                {formattedReasoningContent}
              </div>
            } 
            placement={tooltipPlacement}
            color="#f8f9fa"
            overlayStyle={getTooltipStyle}
            overlayInnerStyle={{
              textAlign: 'left',
              color: '#111',
              fontWeight: 400,
              boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12)',
              borderRadius: '8px',
              padding: '0' // Remove default padding to control it in the content div
            }}
            onOpenChange={(open) => {
              if (open) {
                checkIfMobile();
                updateTooltipPlacement();
              }
            }}
          >
            <Brain className="text-[#E2A5AD] h-4 w-4 cursor-pointer hover:text-[#D88C96]" />
          </Tooltip>
        )}
        {role === 'assistant' && (
          <button
            onClick={handlePlayClick}
            className={twMerge(
              "focus:outline-none transition-all duration-300 ease-in-out relative",
              buttonState === 'playing' && "text-blue-500 hover:text-blue-600",
              buttonState === 'ready' && "text-blue-500 hover:text-blue-600",
              buttonState === 'loading' && "text-blue-400"
            )}
            title={
              buttonState === 'playing' 
                ? 'Stop playing' 
                : buttonState === 'loading' 
                  ? 'Loading audio...' 
                  : 'Play message'
            }
            disabled={buttonState === 'loading'}
          >
            <div className={twMerge(
              "transition-opacity duration-300",
              buttonState === 'loading' ? "opacity-100" : "opacity-0",
              "absolute inset-0 flex items-center justify-center"
            )}>
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div className={twMerge(
              "transition-opacity duration-300",
              buttonState === 'loading' ? "opacity-0" : "opacity-100"
            )}>
              {buttonState === 'playing' ? (
                <StopCircle className="h-4 w-4" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
            </div>
          </button>
        )}
        <span className="text-xs text-gray-500">{format(timestamp, "HH:mm")}</span>
      </div>
    </div>
  );
};

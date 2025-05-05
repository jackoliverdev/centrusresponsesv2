import { FC, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, CheckCircle2, FileText } from 'lucide-react';
import { message } from 'antd';
import ReactMarkdown from 'react-markdown';
import { getAPI } from '@/utils/api';
import { API } from 'common';

interface Step4MessageResultsProps {
  results: {
    messages: Array<{
      type: string;
      content: string;
    }>;
    platformType: string;
    documentIds?: string[];
  } | null;
  isLoading: boolean;
  selectedDocuments?: string[];
}

const Step4MessageResults: FC<Step4MessageResultsProps> = ({ 
  results,
  isLoading,
  selectedDocuments = []
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [documentNames, setDocumentNames] = useState<Record<string, string>>({});

  useEffect(() => {
    console.log('Results prop in Step4MessageResults:', JSON.stringify(results, null, 2));
    if (results?.messages) {
      console.log('Messages in results:', JSON.stringify(results.messages, null, 2));
    }
  }, [results]);

  // Fetch document names when component mounts or selectedDocuments changes
  useEffect(() => {
    if (selectedDocuments && selectedDocuments.length > 0) {
      const fetchDocumentNames = async () => {
        try {
          const { post } = getAPI();
          const docs = await post(API.getDocuments);
          
          // Create a map of document IDs to document names, with null check for docs
          const docMap: Record<string, string> = {};
          if (docs && Array.isArray(docs)) {
            docs.forEach((doc: any) => {
              if (selectedDocuments.includes(doc.id)) {
                docMap[doc.id] = doc.name;
              }
            });
          }
          
          setDocumentNames(docMap);
        } catch (error) {
          console.error('Error fetching document names:', error);
        }
      };
      
      fetchDocumentNames();
    }
  }, [selectedDocuments]);

  const handleCopyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      message.success('Message copied to clipboard!');
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    }).catch(() => {
      message.error('Failed to copy message.');
    });
  };

  // Helper function to extract actual message content
  const getMessageContent = (message: any): string => {
    if (typeof message.content === 'string') {
      return message.content;
    }
    if (typeof message.content === 'object' && message.content !== null) {
      // If content is an object, try to get the text property or stringify it
      return message.content.text || JSON.stringify(message.content);
    }
    return String(message.content || '');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-base font-medium">Generating Messages...</h3>
        <div className="flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          Please wait while we generate your messages.
          <br />
          This may take a moment depending on their complexity.
        </p>
      </div>
    );
  }

  if (!results || !results.messages || results.messages.length === 0) {
    console.log('No results or empty messages array');
    return (
      <div className="space-y-2">
        <h3 className="text-base font-medium">No Results Yet</h3>
        <p className="text-xs text-muted-foreground">
          Your generated messages will appear here once processing is complete.
        </p>
      </div>
    );
  }

  // Log each message as we process it
  console.log('Processing messages for display:', JSON.stringify(results.messages, null, 2));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium">Generated Messages</h3>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Platform:</span>
          <span className="text-xs font-medium">{results.platformType === 'generic' ? 'Generic' : results.platformType}</span>
        </div>
      </div>
      
      {/* Display used documents if any */}
      {selectedDocuments && selectedDocuments.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-3">
          <h4 className="text-sm font-medium text-blue-800 mb-1 flex items-center">
            <FileText className="h-4 w-4 mr-1" />
            Documents Used
          </h4>
          <ul className="list-disc pl-5 space-y-1">
            {selectedDocuments.map(docId => (
              <li key={docId} className="text-xs text-blue-700">
                {documentNames[docId] || docId}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="space-y-3">
        {results.messages.map((message, index) => {
          const messageContent = getMessageContent(message);
          console.log(`Rendering message ${index}:`, { message, extractedContent: messageContent });
          return (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Variant {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleCopyToClipboard(messageContent, index)}
                  >
                    {copiedIndex === index ? (
                      <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    {copiedIndex === index ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="border p-2 rounded-md bg-muted/20">
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-lg my-2" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-md mt-3 mb-2" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-sm mt-2 mb-1" {...props} />,
                      p: ({ node, ...props }) => <p className="text-sm mb-2" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                      li: ({ node, ...props }) => <li className="text-sm mb-1" {...props} />,
                      strong: ({ node, children, ...props }) => <span className="font-bold" {...props}>{children}</span>,
                      em: ({ node, ...props }) => <em className="italic" {...props} />,
                      blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-gray-200 pl-2 italic text-gray-600 my-2" {...props} />,
                      a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                    }}
                  >
                    {messageContent}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
        <h4 className="text-sm font-medium text-blue-800 mb-1">Next Steps</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li className="text-xs text-blue-700">
            Copy any of the messages to use directly in your {results.platformType === 'generic' ? 'campaigns' : `${results.platformType} campaigns`}
          </li>
          <li className="text-xs text-blue-700">
            Edit the messages as needed to better fit your specific requirements
          </li>
          <li className="text-xs text-blue-700">
            Generate new variants by adjusting your message context or documents
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Step4MessageResults; 
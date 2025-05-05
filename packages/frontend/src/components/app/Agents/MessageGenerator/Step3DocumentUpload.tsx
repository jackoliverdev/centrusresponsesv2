import { FC, useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Trash2, Upload, Filter, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useQuery } from 'react-query';
import { getAPI } from '@/utils/api';
import { API } from 'common';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTags } from '@/hooks/tags/useTags';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthContext } from '@/context/AuthContext';
import { WordDocument } from '@/components/icons/WordDocument';
import { PDFDocument } from '@/components/icons/PDFDocument';
import { TextDocument } from '@/components/icons/TextDocument';
import { WebpageDocument } from '@/components/icons/WebpageDocument';
import { ExcelDocument } from '@/components/icons/ExcelDocument';
import { AudioDocument } from '@/components/icons/AudioDocument';
import { GenericDocument } from '@/components/icons/GenericDoucment';
import { format } from 'date-fns';
import { useAgentInstanceUserFieldPermissions } from '@/hooks/useAgentInstanceUserFieldPermissions';
import { uploadDocument } from '@/storage';
import { v4 as uuidv4 } from 'uuid';
import { useAgentInstanceFieldPermissions } from '@/hooks/useAgentInstanceFieldPermissions';
import { getAgentInstances } from 'common';

interface Step3DocumentUploadProps {
  selectedDocuments: string[];
  setSelectedDocuments: (documents: string[]) => void;
  instanceId?: number;
  fieldDefinitions?: Array<{
    name: string;
    label: string;
    description: string;
    step: number;
  }>;
}

// Define a type for uploaded temporary documents
interface TempUploadedDoc {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  isTemp: boolean;
}

// Special filter values
const FILTER_UPLOADED = 'uploaded';

// Predefined tag styles for common tags and uploaded tag
const TAG_STYLES = {
  uploaded: {
    backgroundColor: '#dbeafe', // light blue
    textColor: '#1e40af', // darker blue
    borderColor: '#bfdbfe', // light blue border
  },
  fs: {
    backgroundColor: '#dbeafe', // light blue
    textColor: '#1e40af', // darker blue
    borderColor: '#bfdbfe', // light blue border
  },
  call: {
    backgroundColor: '#e0f2fe', // light blue
    textColor: '#0369a1', // medium blue
    borderColor: '#bae6fd', // light blue border
  },
  marketing: {
    backgroundColor: '#dcfce7', // light green
    textColor: '#166534', // darker green
    borderColor: '#bbf7d0', // light green border
  },
  email: {
    backgroundColor: '#fee2e2', // light red
    textColor: '#b91c1c', // darker red
    borderColor: '#fecaca', // light red border
  }
};

// Get the appropriate icon based on type
const getDocumentIcon = (fileName: string) => {
  const iconWrapper = (icon: React.ReactNode) => (
    <div className="h-4 w-4 mr-2 flex-shrink-0">
      {icon}
    </div>
  );

  // Check if it looks like a website URL first
  if (fileName.includes('www.') || 
      fileName.includes('http:') || 
      fileName.includes('https:') ||
      /\.(com|co\.uk|org|net|io)/.test(fileName)) {
    return iconWrapper(<WebpageDocument />);
  }
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch(extension) {
    case 'doc':
    case 'docx':
      return iconWrapper(<WordDocument />);
    case 'pdf':
      return iconWrapper(<PDFDocument />);
    case 'txt':
      return iconWrapper(<TextDocument />);
    case 'html':
    case 'htm':
    case 'uk':
    case 'co.uk':
    case 'com':
    case 'co':
    case 'org':
    case 'net':
      return iconWrapper(<WebpageDocument />);
    case 'xls':
    case 'xlsx':
    case 'csv':
      return iconWrapper(<ExcelDocument />);
    case 'mp3':
    case 'wav':
    case 'm4a':
      return iconWrapper(<AudioDocument />);
    default:
      return iconWrapper(<FileText className="text-muted-foreground" />);
  }
};

// Function to check if the user can edit the selected documents
const useDocumentPermissions = (instanceId?: number) => {
  const { user } = useAuthContext();
  const [isCreator, setIsCreator] = useState(false);
  
  // Get field permissions
  const { fieldPermissions } = useAgentInstanceFieldPermissions(instanceId || 0);
  const { data: fieldPermissionsData } = fieldPermissions;
  
  // Get user-specific field permissions
  const userFieldPermissionsHook = user && instanceId ? 
    useAgentInstanceUserFieldPermissions(instanceId, user.id) : null;
  
  // Fetch instance data to determine if user is creator
  useEffect(() => {
    if (user && instanceId) {
      const fetchInstanceData = async () => {
        try {
          const { post } = getAPI();
          const instances = await post(getAgentInstances);
          const instance = instances?.find((i: any) => i.id === instanceId);
          if (instance) {
            setIsCreator(user.id === instance.createdBy);
          }
        } catch (error) {
          console.error('Error fetching instance data:', error);
        }
      };
      
      fetchInstanceData();
    }
  }, [user, instanceId]);
  
  // Function to check if a specific field is editable
  const isFieldEditable = (fieldName: string) => {
    // Check user-specific permissions if available
    if (user && userFieldPermissionsHook && !isCreator) {
      return userFieldPermissionsHook.isFieldEditable(fieldName);
    }
    
    // Fall back to instance-wide permissions
    if (isCreator) return true; // Creator can always edit
    
    // Check field-specific permissions
    const permission = fieldPermissionsData?.find(p => p.fieldName === fieldName);
    return permission ? !permission.isHidden : true; // If not hidden, it's editable
  };
  
  return {
    canEditDocuments: isFieldEditable('documentIds'),
    isCreator
  };
};

const Step3DocumentUpload: FC<Step3DocumentUploadProps> = ({ 
  selectedDocuments, 
  setSelectedDocuments, 
  instanceId,
  fieldDefinitions
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [lastUploadedId, setLastUploadedId] = useState<string | null>(null);
  // Track recently uploaded documents that may not be in the API response yet
  const [recentlyUploadedDocs, setRecentlyUploadedDocs] = useState<TempUploadedDoc[]>([]);

  // Get current user to access their tags permissions
  const { user } = useAuthContext();

  // Check document editing permissions
  const { canEditDocuments } = useDocumentPermissions(instanceId);

  // Fetch organization documents
  const { data: documents, isLoading: isLoadingDocs, refetch: refetchDocs } = useQuery(['documents'], async () => {
    const { post } = getAPI();
    const result = await post(API.getDocuments);
    return result || [];
  });

  // Combined documents including temporary ones
  const allDocuments = useMemo(() => {
    if (!documents) return recentlyUploadedDocs;
    return [...documents, ...recentlyUploadedDocs];
  }, [documents, recentlyUploadedDocs]);

  // Fetch all available tags
  const { data: tagsData, isLoading: isLoadingTags } = useTags();
  
  // Extract user's tag IDs from their profile
  const userTagIds = useMemo(() => {
    if (!user || !user.tags) return [];
    
    return user.tags.map(tag => {
      if (typeof tag === 'object') {
        return tag.id;
      }
      return tag;
    });
  }, [user]);
  
  // Filter tags to only include what the user has explicit access to
  const userAccessibleTags = useMemo(() => {
    if (!tagsData || !userTagIds.length) return [];
    
    return tagsData.filter(tag => userTagIds.includes(tag.id));
  }, [tagsData, userTagIds]);
  
  // Filter documents to only include documents that have no tag or 
  // have a tag that the user has explicit access to
  const filteredAllDocuments = useMemo(() => {
    // Return all recently uploaded documents regardless of tag permissions
    const uploadedDocs = recentlyUploadedDocs.map(doc => ({
      ...doc,
      isAccessible: true
    }));
    
    if (!documents || !user) return uploadedDocs;
    
    // For regular documents, add accessibility flag
    const accessibleDocs = documents.map(doc => {
      // Allow if document has no tag
      if (!doc.documentTag) {
        return { ...doc, isAccessible: true };
      }
      
      // Allow if user has access to this tag
      if (userTagIds.includes(doc.documentTag.id)) {
        return { ...doc, isAccessible: true };
      }
      
      // Otherwise, document is not accessible
      return { ...doc, isAccessible: false };
    });
    
    // Filter to only include accessible documents plus recently uploaded ones
    return [...accessibleDocs.filter(doc => doc.isAccessible), ...uploadedDocs];
  }, [documents, recentlyUploadedDocs, userTagIds, user]);
  
  // Get unique tag names from accessible documents for the filters
  const accessibleDocumentTagNames = useMemo(() => {
    const tagNames = new Set<string>();
    
    filteredAllDocuments.forEach((doc: any) => {
      if (doc.documentTag && doc.documentTag.name && doc.isAccessible) {
        tagNames.add(doc.documentTag.name.toLowerCase());
      }
    });
    
    return Array.from(tagNames);
  }, [filteredAllDocuments]);

  // Filter documents based on selected tag
  const finalFilteredDocuments = useMemo(() => {
    // Only show recently uploaded documents if that filter is applied
    if (selectedTag === FILTER_UPLOADED) {
      return filteredAllDocuments.filter((doc: any) => 
        doc.id === lastUploadedId || doc.isTemp
      );
    } 
    // Filter by selected tag
    else if (selectedTag) {
      const isPredefinedTag = Object.keys(TAG_STYLES).includes(selectedTag);
      
      if (isPredefinedTag) {
        // Filter by tag name (for system tags)
        return filteredAllDocuments.filter((doc: any) => 
          doc.documentTag && doc.documentTag.name && 
          doc.documentTag.name.toLowerCase() === selectedTag.toLowerCase()
        );
      } else {
        // Filter by tag ID (for API tags)
        return filteredAllDocuments.filter((doc: any) => 
          doc.documentTag && doc.documentTag.id === selectedTag
        );
      }
    }
    
    // If no specific tag filter is applied, return all accessible documents
    return filteredAllDocuments;
  }, [filteredAllDocuments, selectedTag, lastUploadedId]);

  // Create a map of tag name to tag properties for easy lookup
  const tagMap = useMemo(() => {
    const map = new Map();
    
    // First add our predefined styles
    Object.entries(TAG_STYLES).forEach(([key, style]) => {
      map.set(key, { id: key, name: key, ...style });
    });
    
    // Then add tags from the API, which will override predefined ones if there's a name match
    if (userAccessibleTags && userAccessibleTags.length > 0) {
      userAccessibleTags.forEach((tag: any) => {
        map.set(tag.name.toLowerCase(), tag);
      });
    }
    
    return map;
  }, [userAccessibleTags]);

  // Handle document selection toggling
  const toggleDocumentSelection = useCallback((documentId: string) => {
    if (!canEditDocuments) return; // Skip if user doesn't have permission
    
    setSelectedDocuments(
      selectedDocuments.includes(documentId)
        ? selectedDocuments.filter(id => id !== documentId)
        : [...selectedDocuments, documentId]
    );
  }, [selectedDocuments, setSelectedDocuments, canEditDocuments]);

  // Function to clear document selection
  const clearSelection = useCallback(() => {
    if (!canEditDocuments) return; // Skip if user doesn't have permission
    setSelectedDocuments([]);
  }, [setSelectedDocuments, canEditDocuments]);

  const handleUploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadSuccess(false);
    setUploadError(null);
    setUploadedFile(file);
    setLastUploadedId(null);
    
    try {
      // Upload document to storage and get the path
      const path = await uploadDocument(file);
      
      // Add document to the database using the API
      const { post } = getAPI();
      const result = await post(API.addDocument, {
        name: file.name,
        path: path,
        type: 'text', // Default to text type - could be made smarter based on file extension
      });
      
      // Get the document ID from the result, with null check
      const newDocId = result?.id || `temp-doc-${Date.now()}`;
      
      // Create a temporary document object to display before API refresh
      const tempDoc: TempUploadedDoc = {
        id: newDocId,
        name: file.name,
        size: file.size,
        createdAt: new Date().toISOString(),
        isTemp: true
      };
      
      // Add to recently uploaded docs
      setRecentlyUploadedDocs(prev => [...prev, tempDoc]);
      
      setUploadSuccess(true);
      setLastUploadedId(newDocId);
      
      // Add the newly uploaded document to selected documents
      if (!selectedDocuments.includes(newDocId)) {
        setSelectedDocuments([...selectedDocuments, newDocId]);
      }
      
      // Refresh document list
      refetchDocs();
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [refetchDocs, setSelectedDocuments, selectedDocuments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
    // Reset the input so the same file can be selected again
    if (e.target.value) e.target.value = '';
  };

  // Reset success message after 3 seconds but keep the document in selected list
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (uploadSuccess) {
      timer = setTimeout(() => {
        setUploadSuccess(false);
        setUploadedFile(null);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [uploadSuccess]);

  // When documents are fetched, remove temporary docs that now exist in the real list
  useEffect(() => {
    if (documents && documents.length > 0 && recentlyUploadedDocs.length > 0) {
      // Keep only temp docs whose IDs are still in selectedDocuments but not in real documents
      setRecentlyUploadedDocs(prev => 
        prev.filter(tempDoc => 
          selectedDocuments.includes(tempDoc.id) && 
          !documents.some((doc: any) => doc.id === tempDoc.id)
        )
      );
    }
  }, [documents, selectedDocuments]);

  // Generate a badge for a tag
  const renderTagBadge = (tagName: string, isApi = false, tagData?: any) => {
    // Look up the tag in our map - normalize to lowercase for comparison
    const normalizedTagName = tagName.toLowerCase();
    const tag = tagData || tagMap.get(normalizedTagName);
    
    if (!tag) return null;
    
    const isSelected = selectedTag === (isApi ? tag.id : normalizedTagName);
    
    return (
      <Badge
        key={isApi ? tag.id : normalizedTagName}
        variant="outline"
        className={`cursor-pointer mb-1 mr-1 ${isSelected ? 'ring-1 ring-primary border-primary' : ''}`}
        style={{ 
          backgroundColor: tag.backgroundColor, 
          color: tag.textColor,
          border: isSelected ? '2px solid #1e40af' : `1px solid ${tag.borderColor || tag.backgroundColor}`
        }}
        onClick={() => setSelectedTag(isSelected ? null : (isApi ? tag.id : normalizedTagName))}
      >
        {tag.name}
      </Badge>
    );
  };

  // Only render tag filters that the user has access to
  const renderTagFilters = () => {
    // Always show the "Uploaded" filter if we have any recently uploaded docs
    const filters = [];
    
    // Add "Clear Filter" button if any filter is applied
    if (selectedTag) {
      filters.push(
        <Badge
          key="clear-filter"
          variant="outline"
          className="cursor-pointer mb-1 mr-1"
          style={{ 
            backgroundColor: '#f1f5f9', 
            color: '#64748b',
            border: '1px solid #e2e8f0'
          }}
          onClick={() => setSelectedTag(null)}
        >
          Clear Filter ×
        </Badge>
      );
    }
    
    if (recentlyUploadedDocs.length > 0 || lastUploadedId) {
      filters.push(
        <Badge
          key="uploaded"
          variant="outline"
          className="cursor-pointer mb-1 mr-1"
          style={{ 
            backgroundColor: selectedTag === FILTER_UPLOADED ? 
              '#dbeafe' : // lighter blue
              TAG_STYLES.uploaded.backgroundColor, 
            color: TAG_STYLES.uploaded.textColor,
            border: `1px solid ${TAG_STYLES.uploaded.borderColor}`
          }}
          onClick={() => setSelectedTag(selectedTag === FILTER_UPLOADED ? null : FILTER_UPLOADED)}
        >
          Recently Uploaded
        </Badge>
      );
    }
    
    // Add tag filters only for tags that exist on accessible documents
    // AND that the user has access to
    if (accessibleDocumentTagNames.length > 0 && userAccessibleTags.length > 0) {
      // First get only the tag names from the user's accessible tags
      const userAccessibleTagNames = userAccessibleTags.map(tag => 
        tag.name.toLowerCase()
      );
      
      // Then filter the document tags to only include ones the user has access to
      const filteredTagNames = accessibleDocumentTagNames.filter(tagName => 
        userAccessibleTagNames.includes(tagName)
      );
      
      // Render badges for each tag the user has access to
      filteredTagNames.forEach(tagName => {
        const matchingTag = userAccessibleTags.find(
          tag => tag.name.toLowerCase() === tagName
        );
        
        if (matchingTag) {
          filters.push(
            renderTagBadge(tagName, true, matchingTag)
          );
        }
      });
    }
    
    return filters;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Document Attachments</Label>
        
        {!canEditDocuments && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Lock className="h-3 w-3 mr-1" />
            <span>You don't have permission to modify document attachments</span>
          </div>
        )}
        
        {selectedDocuments.length > 0 && canEditDocuments && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearSelection}
            className="h-6 text-xs"
          >
            Clear selection ({selectedDocuments.length})
          </Button>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground -mt-2">
        Attach relevant documents to enhance the generated messages. The AI can use information from these documents.
      </p>

      {/* Upload Section with immediate feedback */}
      <div className="mb-4">
        <Card className="border-dashed border-2 p-0">
          <CardContent className="flex flex-col justify-center items-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="text-base font-medium mb-1">Upload Document</h4>
            <p className="text-xs text-muted-foreground mb-3">
              PDF, Word, Excel, and text files up to 10MB
            </p>
            
            {!isUploading && !uploadSuccess && !uploadError && (
              <label 
                htmlFor="file-upload" 
                className={`cursor-pointer bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors duration-200 ${!canEditDocuments ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Select File
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (!canEditDocuments) return; // Skip if no permission
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadedFile(file);
                      handleUploadFile(file);
                    }
                  }}
                  disabled={!canEditDocuments}
                  accept=".pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.csv,.md"
                />
              </label>
            )}
            
            {isUploading && (
              <div className="text-sm text-blue-600 flex items-center">
                <div className="animate-spin mr-2">
                  <Upload className="w-4 h-4" />
                </div>
                Uploading {uploadedFile?.name || 'file'}...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Documents Summary - Moved above Available Documents */}
      {selectedDocuments.length > 0 && (
        <div className="mb-3 p-2 bg-primary/5 rounded-md border border-primary/20">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-sm font-medium">Selected Documents ({selectedDocuments.length})</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearSelection}
              className="h-6 text-xs"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedDocuments.map(docId => {
              // Find in regular docs first, then in temp docs if not found
              const doc = allDocuments.find((d: any) => d.id === docId);
              if (!doc) return null;
              
              return (
                <div 
                  key={docId} 
                  className={`inline-flex items-center rounded-full px-2 py-0.5 ${
                    docId === lastUploadedId ? 'bg-green-100 border border-green-300' : 'bg-primary/10'
                  }`}
                >
                  <span className="text-xs truncate max-w-[150px]">{doc.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDocumentSelection(docId)}
                    className="h-4 w-4 p-0 ml-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Document Selection with Tags */}
      <div className="mb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
          <div className="flex items-center gap-1 mb-2 sm:mb-0">
            <Label className="text-sm">Available Documents</Label>
            
            {/* Select All / Clear button */}
            {selectedDocuments.length > 0 ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearSelection}
                className="h-6 px-2 text-xs font-normal ml-1"
              >
                Clear
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Select all documents currently visible after filtering
                  const documentIds = finalFilteredDocuments.map((doc: any) => doc.id);
                  setSelectedDocuments(documentIds);
                }}
                className="h-6 px-2 text-xs font-normal ml-1"
              >
                Select All
              </Button>
            )}
            
            {selectedDocuments.length > 0 ? (
              <span className="text-blue-600 text-xs ml-1">
                Selected: {selectedDocuments.length}
              </span>
            ) : null}
          </div>
          
          {/* Tag Filter UI - Simple flex with wrap */}
          <div className="w-full sm:w-auto flex flex-wrap items-center gap-1">
            <div className="flex items-center mr-1">
              <Filter className="h-3 w-3 text-muted-foreground mr-1 flex-shrink-0" />
              <span className="text-xs text-muted-foreground">Filters:</span>
            </div>
            {renderTagFilters()}
          </div>
        </div>
        
        {/* Document Listing */}
        {isLoadingDocs && recentlyUploadedDocs.length === 0 ? (
          <div className="space-y-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center p-2 border rounded-md animate-pulse">
                <div className="h-3 w-3 mr-2 bg-gray-200 rounded"></div>
                <div className="h-3 w-3 mr-2 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-3 w-24 mb-1 bg-gray-200 rounded"></div>
                  <div className="h-2 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {finalFilteredDocuments && finalFilteredDocuments.length > 0 ? (
              <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                {finalFilteredDocuments.map((doc: any) => (
                  <div 
                    key={doc.id}
                    className={`flex items-center p-2 hover:bg-muted/50 transition-colors ${
                      selectedDocuments.includes(doc.id) ? 'bg-muted' : ''
                    } ${doc.id === lastUploadedId ? 'bg-green-50' : ''}`}
                  >
                    <div className="flex items-center min-w-0">
                      <Checkbox 
                        id={`doc-${doc.id}`}
                        checked={selectedDocuments.includes(doc.id)}
                        onCheckedChange={() => toggleDocumentSelection(doc.id)}
                        className="mr-2 h-3 w-3 data-[state=checked]:bg-primary"
                        disabled={!canEditDocuments}
                      />
                    </div>
                    {getDocumentIcon(doc.name)}
                    <label 
                      htmlFor={`doc-${doc.id}`} 
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <p className="text-xs font-medium truncate">{doc.name}</p>
                        {(doc.id === lastUploadedId || doc.isTemp) && (
                          <Badge className="ml-1 text-[10px] py-0 h-4 bg-blue-100 text-blue-800 border-blue-200">Uploaded</Badge>
                        )}
                      </div>
                      <div className="flex items-center">
                        <p className="text-[10px] text-muted-foreground">
                          {(doc.size / 1024).toFixed(2)} KB • {format(new Date(doc.created_at || doc.createdAt), 'dd MMM yyyy')}
                        </p>
                        {doc.documentTag && (
                          <Badge 
                            variant="outline" 
                            className="ml-1 text-[10px] py-0 h-4"
                            style={{ 
                              backgroundColor: doc.documentTag.backgroundColor,
                              color: doc.documentTag.textColor,
                              borderColor: doc.documentTag.backgroundColor
                            }}
                          >
                            {doc.documentTag.name}
                          </Badge>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2 border rounded-md text-center text-xs text-muted-foreground">
                {selectedTag === FILTER_UPLOADED
                  ? 'No recently uploaded documents found.'
                  : selectedTag 
                    ? 'No documents found with the selected tag.' 
                    : 'No documents available with your tag permissions. Upload documents to enhance message generation.'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Step3DocumentUpload; 
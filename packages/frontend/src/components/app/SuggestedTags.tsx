import { FunctionComponent } from 'react';
import { DataAccessTag } from './DataAccessTag';
import { Tooltip } from 'antd';
import { TagItemData } from 'common';
import { useSuggestedTags } from '@/hooks/documents/useSuggestedTags';

type Props = {
  documentId: string;
  organizationId: number;
  onSelectTag: (tag: TagItemData) => void;
  existingTag?: TagItemData;
};

export const SuggestedTags: FunctionComponent<Props> = ({
  documentId,
  organizationId,
  onSelectTag,
  existingTag
}) => {
  const { data: suggestedTags = [], isLoading } = useSuggestedTags(documentId, organizationId);

  // Don't show suggestions if there's already a tag or no suggestions
  if (existingTag || suggestedTags.length === 0 || isLoading) {
    return null;
  }

  // Only take the first suggestion (highest confidence)
  const topSuggestion = suggestedTags[0];

  return (
    <div className="flex items-center gap-2 ml-2">
      <span className="text-sm text-gray-500">Suggested tag:</span>
      <Tooltip title={`Confidence: ${Math.round(topSuggestion.confidence * 100)}%`}>
        <button 
          onClick={() => onSelectTag(topSuggestion)}
          className="transition-transform hover:scale-105"
        >
          <DataAccessTag tag={topSuggestion} />
        </button>
      </Tooltip>
    </div>
  );
}; 
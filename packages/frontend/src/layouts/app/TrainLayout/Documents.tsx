import { FunctionComponent } from "react";
import { Document } from "./Document";
import { DocumentsSchema } from 'common';
import { Loading } from "@/components/common/Loading";
import { useAuthContext } from "@/context/AuthContext";

export type DocumentsProps = {
  documents: DocumentsSchema;
  loading?: boolean;
  selectedDocumentIds?: Set<string>;
  onDocumentSelect?: (documentId: string, selected: boolean) => void;
};

export const Documents: FunctionComponent<DocumentsProps> = ({
  documents,
  loading = false,
  selectedDocumentIds = new Set(),
  onDocumentSelect,
}) => {
  const { organizations } = useAuthContext();
  const organizationId = organizations?.[0]?.id || 0;

  if (loading) {
    return (
      <div>
        <Loading />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center text-xl text-neutral-400 font-medium py-6">
        No documents.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {documents.map((document) => (
        <Document
          key={document.id}
          {...document}
          isSelected={selectedDocumentIds.has(document.id)}
          onSelect={(selected) => onDocumentSelect?.(document.id, selected)}
          organizationId={organizationId}
        />
      ))}
    </div>
  );
};

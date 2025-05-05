import { Loader } from '@/components/ui/loader';
import { useAddDocument } from '@/hooks/documents/useAddDocument';
import { useSafeContext } from '@/hooks/useSafeContext';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import {
  createContext,
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { v4 } from 'uuid';
import { useAuthContext } from './AuthContext';
import { UseMutationOptions } from 'react-query';
import { formatBytes } from '@/utils';

type AddParameters = {
  file: File;
  type: 'text' | 'audio';
};
const UploadDocumentContext = createContext<{
  add: ({ file, type }: AddParameters, options?: UseMutationOptions<void, unknown, AddParameters>) => void;
  notifyFailed: (name: string, size: number) => void;
} | null>({
  add: () => {},
  notifyFailed: () => {},
});

export const UploadDocumentProvider: FunctionComponent<
  PropsWithChildren<object>
> = ({ children }) => {
  const { user } = useAuthContext();
  const [files, setFiles] = useState<
    Record<
      string,
      { name: string; status: 'processing' | 'success' | 'failed', id: string, size: number }
    >
  >({});

  const { mutate } = useAddDocument({
    onMutate: ({ file, id }) => {
      setFiles((prev) => ({
        ...prev,
        [id]: { id, name: file.name, size: file.size, status: 'processing' },
      }));
    },
    onSuccess: (_, { id }) => {
      setFiles((prev) => ({
        ...prev,
        [id]: { ...prev[id], status: 'success' },
      }));
    },
    onError: (_, { id }) => {
      setFiles((prev) => ({
        ...prev,
        [id]: { ...prev[id], status: 'failed' },
      }));
    },
  });

  const add = useCallback(
    (data: AddParameters, options?: UseMutationOptions<void, unknown, AddParameters>) => {
      mutate({ id: v4(), ...data }, options);
    },
    [mutate],
  );

  const notifyFailed = useCallback(
    (name: string, size: number) => {
      const id = v4();
      setFiles((prev) => ({
        ...prev,
        [id]: { id, name, size, status: 'failed' },
      }));
    },
    [],
  );

  const value = useMemo(() => ({ add, notifyFailed }), [add, notifyFailed]);
  const hasDocuments = useMemo(() => Object.values(files).length > 0, [files]);
  const isProcessing = useMemo(
    () => Object.values(files).some(({ status }) => status === 'processing'),
    [files],
  );

  return (
    <UploadDocumentContext.Provider value={value}>
      {hasDocuments && user && (
        <div className="fixed bottom-4 right-4 z-10 bg-white p-4 shadow border rounded-xl space-y-2 min-w-64">
          <div className="flex justify-between items-center">
            <div className="font-semibold">Uploading Files</div>
            {!isProcessing && (
              <button
                onClick={() => setFiles({})}
                className="text-neutral-400 hover:text-neutral-500"
              >
                <CloseCircleOutlined />
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {Object.values(files)
              .reverse()
              .map(({ name, status, size, id }) => (
                <div key={id} className="flex items-center gap-2">
                  {status == "success" ? (
                    <CheckCircleOutlined className="text-green-600 size-4" />
                  ) : status == "failed" ? (
                    <CloseOutlined className="text-red-500 size-4" />
                  ) : (
                    <Loader className="size-4" />
                  )}
                  <div>{name} - {formatBytes(size)}</div>
                </div>
              ))}
          </div>
        </div>
      )}
      {children}
    </UploadDocumentContext.Provider>
  );
};

export const useUploadDocument = () => useSafeContext(UploadDocumentContext);

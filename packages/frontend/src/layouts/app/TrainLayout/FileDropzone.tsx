import { Loader } from "@/components/ui/loader";
import { CloudUpload, Upload } from "lucide-react";
import { FunctionComponent, useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { twMerge } from "tailwind-merge";
import { useWindowSize } from "@uidotdev/usehooks";
import { App, Button } from "antd";
import { getKnowledgeBaseType, TRAIN_DOCUMENT_MIMES } from 'common';
import { useUploadDocument } from "@/context/UploadDocumentContext";
import { usePlan } from "@/hooks/plan/usePlan";

export type FileDropzoneProps = object;

export const FileDropzone: FunctionComponent<FileDropzoneProps> = ({}) => {
  const { message } = App.useApp();
  const { width = 0 } = useWindowSize();
  const { data: plan } = usePlan();
  const { usages, usageLimits } = plan || {};
  const { add, notifyFailed } = useUploadDocument();
  const [totalSessionUploads, setTotalSessionUploads] = useState(0);
  const isLoading = false;

  const hasEnoughStorage = useCallback(
    (additionalSize: number) => {
      const storageUsage = usages?.storage ?? 0;
      const storageLimit = usageLimits?.storage ?? 0;
      return storageUsage + additionalSize < storageLimit;
    },
    [usages, usageLimits],
  );

  const { getInputProps, getRootProps } = useDropzone({
    onDrop: (acceptedFiles, fileRejections) => {
      let skipped = 0;
      const filesToUpload = acceptedFiles.filter((file) => {
        if (hasEnoughStorage(totalSessionUploads + file.size)) {
          setTotalSessionUploads((prev) => prev + file.size);
          return true;
        } else {
          notifyFailed(file.name, file.size);
          skipped++;
        }
      });

      for (const file of filesToUpload) {
        const type = getKnowledgeBaseType(file.name);
        if (type) {
          add(
            { file, type },
            {
              onSettled() {
                setTotalSessionUploads((prev) => prev - file.size);
              },
            },
          );
        } else {
          // unsupported file
          notifyFailed(file.name, file.size);
        }
      }

      fileRejections.forEach(rejection => {
        notifyFailed(rejection.file.name, rejection.file.size);
      })

      if (skipped) {
        void message.error(
          `Due to storage limits, ${skipped} file(s) could not be uploaded`,
        );
      }
      if (fileRejections.length) {
        void message.error(
          `Due to file size limits, ${fileRejections.length} file(s) could not be uploaded`,
        );
      }
    },
    accept: TRAIN_DOCUMENT_MIMES,
  });

  if (width && width < 700)
    return (
      <>
        <Button
          color="primary"
          className="flex items-center justify-center w-full !py-6 border-blue-500 text-blue-500 font-bold"
          size="large"
          icon={<CloudUpload className="size-4" />}
          {...getRootProps()}
        >
          Upload File
        </Button>
        <input {...getInputProps()} />
      </>
    );

  return (
    <div
      className={twMerge(
        "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-white",
        isLoading && "opacity-50",
      )}
      {...getRootProps()}
    >
      <div className="mb-4">
        {isLoading ? (
          <Loader className="size-12 mx-auto" />
        ) : (
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
        )}
      </div>
      <p className="text-lg mb-2">
        Drag and drop or{" "}
        <span className="text-primary font-semibold">browse</span> for a file to
        upload
      </p>
      <p className="text-sm text-gray-500">
        Supported file types:{" "}
        <span className="text-primary">
          {Object.values(TRAIN_DOCUMENT_MIMES)
            .map((mime) => mime)
            .join(", ")}
        </span>
      </p>
      <input {...getInputProps()} />
    </div>
  );
};

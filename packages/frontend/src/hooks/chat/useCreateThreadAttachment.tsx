import { useMutation, UseMutationResult } from "react-query";
import { getAPI } from "@/utils/api";
import { API, AttachmentSchema, RequestBodyType } from "common";
import { message } from "antd";

// Define the expected request body type based on the API definition
type UploadAttachmentBody = RequestBodyType<typeof API.uploadThreadAttachment>;

// Define types for clarity
type UploadParams = { threadId: string; file: File };
type MutationError = Error;

const uploadAttachmentMutationFn = async (params: UploadParams): Promise<AttachmentSchema> => {
  const formData = new FormData();
  formData.append('file', params.file, params.file.name);
  formData.append('threadId', params.threadId);

  // Pass the endpoint definition and the FormData.
  // Use 'as any' for the body temporarily due to type definition ambiguity for multipart.
  // We explicitly cast the response to AttachmentSchema as post returns Promise<any> here.
  const response = await getAPI().post(API.uploadThreadAttachment, formData as any);
  return response as AttachmentSchema;
};

export const useCreateThreadAttachment = (): UseMutationResult<AttachmentSchema, MutationError, UploadParams> => {
  // Use the overload useMutation(mutationFn, options?)
  return useMutation<AttachmentSchema, MutationError, UploadParams>(
    uploadAttachmentMutationFn,
    {
      onError: (error: MutationError) => {
        console.error("Attachment upload error:", error);
        message.error("Failed to upload attachment. Please try again.");
      },
      // onSuccess should return void or Promise<unknown>
      onSuccess: (data: AttachmentSchema, variables: UploadParams) => {
        // Perform side effects here if needed, e.g.:
        // message.success(`Attachment "${data.filename}" uploaded for thread ${variables.threadId}.`);
        // queryClient.invalidateQueries(...)
        console.log("Attachment uploaded successfully:", data);
        // No explicit return (implicitly returns void)
      },
    }
  );
}; 
import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { API, FolderWithThreadsSchema } from "common";
import { message } from "antd";
import { isThreadInFolder } from "@/utils";

export const useBulkAttachThreadToFolder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { threadIds: string[]; folderId: number; folders?: FolderWithThreadsSchema[] }) => {
      const { threadIds, folderId, folders = [] } = params;
      
      // Find the target folder to check if threads are already in it
      const targetFolder = folders.find(folder => folder.id === folderId);
      
      // Filter out threads that are already in the folder
      let threadsToAdd = threadIds;
      if (targetFolder) {
        threadsToAdd = threadIds.filter(threadId => !isThreadInFolder(threadId, targetFolder));
        
        // If all threads are already in the folder, return early with a message
        if (threadsToAdd.length === 0) {
          message.info(`All ${threadIds.length} ${threadIds.length === 1 ? 'thread is' : 'threads are'} already in this folder`);
          return [];
        }
        
        // If some threads are already in the folder, show informational message
        if (threadsToAdd.length < threadIds.length) {
          const skippedCount = threadIds.length - threadsToAdd.length;
          message.info(`${skippedCount} ${skippedCount === 1 ? 'thread is' : 'threads are'} already in this folder and will be skipped`);
        }
      }
      
      // Create an array of promises for each thread attachment
      const promises = threadsToAdd.map((threadId) => 
        getAPI().post(API.attachThreadToFolder, { threadId, folderId })
      );
      
      // Execute all promises in parallel
      return Promise.all(promises);
    },
    onSuccess: (results, { threadIds, folderId, folders = [] }) => {
      queryClient.invalidateQueries(["thread-folders"]);
      
      // Find the target folder to check how many threads were actually added
      const targetFolder = folders.find(folder => folder.id === folderId);
      
      // Count threads that weren't already in the folder
      let addedCount = results.length;
      let skippedCount = 0;
      
      if (targetFolder) {
        skippedCount = threadIds.length - addedCount;
      }
      
      if (addedCount > 0) {
        if (skippedCount > 0) {
          message.success(`Added ${addedCount} ${addedCount === 1 ? 'thread' : 'threads'} to folder (${skippedCount} already in folder)`);
        } else {
          message.success(`${addedCount} ${addedCount === 1 ? 'thread' : 'threads'} added to folder`);
        }
      }
    },
    onError: () => {
      message.error("Failed to add threads to folder. Please try again");
    }
  });
}; 
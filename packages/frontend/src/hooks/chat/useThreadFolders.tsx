import { useQuery } from "react-query";
import { getAPI } from "@/utils/api";
import { API } from "common";

export const useThreadFolders = () => {
  return useQuery({
    queryFn: () => getAPI().post(API.getThreadFolders),
    queryKey: ["thread-folders"],
  });
};

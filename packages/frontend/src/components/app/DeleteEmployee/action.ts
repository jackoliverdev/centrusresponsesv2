import { getAPI } from "@/utils/api";
import { API } from "common";

export const deleteEmployee = async (
  userId: number,
  orgId?: number,
): Promise<string | void> => {
  try {
    await getAPI({
      organizationId: orgId,
    }).post(API.deleteMemberFromOrganization, {
      userId,
    });
  } catch (err: any) {
    const message = err?.response?.data?.message || "Something went wrong";

    return message;
  }
};

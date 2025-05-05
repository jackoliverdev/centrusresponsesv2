import { API } from "common";
import { getAPI } from "@/utils/api";
import { EmployeeFormSchema } from "@/utils/form-schema";
import { pickBy } from "lodash";

export const editEmployee = async (
  userId: number,
  data: Partial<EmployeeFormSchema> & {
    teamMemberIds: number[];
  },
  orgId?: number,
) => {
  const {
    firstName,
    lastName,
    image = "",
    isAdmin,
    teamlead_id,
    is_teamleader,
    teamMemberIds,
    tags,
    phone,
    address,
    position,
  } = data;

  const profile =
    address || position
      ? {
          address,
          position,
        }
      : undefined;

  return getAPI({
    organizationId: orgId,
  }).post(
    API.adminUpdateUser,
    pickBy(
      {
        id: userId,
        firstName,
        lastName,
        profile,
        image,
        teamlead_id,
        is_teamleader,
        isAdmin,
        teamMemberIds,
        tags,
        phone,
      },
      (v) => v != undefined,
    ),
  );
};

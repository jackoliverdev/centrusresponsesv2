import { UserOrganizationSchema, UserSchema } from "common";

export type UserWithRole = UserSchema & {
  role: UserOrganizationSchema["role"];
};

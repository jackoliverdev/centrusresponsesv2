import { useMutation } from "react-query";
import { API, SignUpWithOrganizationDto } from "common";
import { getAPI } from "@/utils/api";
import { useSignInWithEmailAndPassword } from "@/hooks/auth/useSignInWithEmailAndPassword";

export const useCreateOrganization = () => {
  const { mutateAsync: signInWithEmailAndPassword } =
    useSignInWithEmailAndPassword();

  return useMutation<
    undefined,
    Error,
    SignUpWithOrganizationDto
  >({
    mutationFn: async (data: SignUpWithOrganizationDto) => {
      // Then send data to backend, firebase user is created on backend before record is saved on db
      const completeData: SignUpWithOrganizationDto = {
        organization: {
          name: data.organization.name.trim(),
        },
        user: {
          email: data.user.email.trim(),
          password: data.user.password,
          firstName: data.user.firstName?.trim(),
          lastName: data.user.lastName?.trim(),
        },
      };

      await getAPI().post(API.signUpWithOrganization, completeData);

      // sign in on success
      await signInWithEmailAndPassword({
        email: data.user.email.trim(),
        password: data.user.password,
      });
    },
  });
};

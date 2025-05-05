import { useCallback, useEffect, useMemo, useState } from "react";
import { scaffoldContext } from "@/context/scaffoldContext";

import { clientAuth } from "@/utils/firebase-client";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
} from "@firebase/auth";
import {
  ALL_USER_ROLES,
  API,
  isRoleAllowed,
  PLATFORM_ADMIN_ORG,
  UserWithOrganizationSchema,
} from "common";
import { getAPI } from "@/utils/api";
import { useQueryClient } from "react-query";
import { FirebaseError } from "firebase/app";
import { message } from 'antd';
import { AxiosError, isAxiosError } from 'axios';

const useAuthContextValue = () => {
  const [user, setUser] = useState<UserWithOrganizationSchema | null>(null);
  const [organizations, setOrganizations] = useState<
    UserWithOrganizationSchema["organizations"] | null
  >(null);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [activeOrgId, setActiveOrgId] = useState<number | undefined>();

  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(true);

  const handleFirebaseError = useCallback((code: string) => {
    let errorMessage = "An error occurred";
    switch (code) {
      case "auth/email-already-in-use":
        errorMessage = "This email is already registered. Please sign in instead.";
        break;
      case "auth/invalid-email":
        errorMessage = "Invalid email address format.";
        break;
      case "auth/operation-not-allowed":
        errorMessage =
          "Email/password accounts are not enabled. Please contact support.";
        break;
      case "auth/weak-password":
        errorMessage = "Password should be at least 6 characters.";
        break;
      case "auth/invalid-credential":
        errorMessage = "Invalid Email/Password";
        break;
    }

    return Error(errorMessage);
  }, []);

  const signOut = useCallback(async () => {
    queryClient.clear();
    await firebaseSignOut(clientAuth);
  }, [queryClient]);

  const refresh = useCallback(async () => {
    try {
      const fetchedProfile = await getAPI().post(API.getOrCreateUser).catch();

      if (fetchedProfile) {
        setUser(fetchedProfile);
        setOrganizations(
          fetchedProfile.organizations.filter(
            (org) => org.id !== PLATFORM_ADMIN_ORG.organizationId,
          ),
        );

        const fetchedActiveOrgId =
          fetchedProfile.activeOrganizationId ??
          fetchedProfile.organizations?.[0]?.id;

        setActiveOrgId(
          fetchedProfile.activeOrganizationId ??
            fetchedProfile.organizations?.[0]?.id,
        );

        const userRole = fetchedProfile.organizations.find(
          ({ id }) => id === fetchedActiveOrgId,
        )?.role;
        setIsOrgAdmin(isRoleAllowed(userRole, [ALL_USER_ROLES[2]]));
        setIsPlatformAdmin(
          fetchedProfile?.organizations?.some(
            (o) => o.id === PLATFORM_ADMIN_ORG.organizationId,
          ),
        );
      } else {
        message.error("Account not found");
      }
    } catch (e) {
      if (isAxiosError(e)) {
        if (e.code === AxiosError.ERR_NETWORK) {
          message.error(e.message);
        } else {
          signOut().catch();
        }
      }
    }
  }, [signOut]);
  /**
   * Sync authUser with Firebase authentication.
   */
  useEffect(() => {
    const unsubscribe = clientAuth.onAuthStateChanged(async (newUser) => {
      setIsLoading(true);

      if (newUser) {
        await refresh();
      } else {
        setUser(null);
        setOrganizations(null);
        setIsOrgAdmin(false);
        setIsPlatformAdmin(false);
      }

      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, refresh]);

  const changeEmail = useCallback(async (email: string) => {
    try {
      if (clientAuth.currentUser) {
        await firebaseUpdateEmail(clientAuth.currentUser, email);
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        message.error("Error changing email Address");
      }
    }
  }, []);

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      if (clientAuth.currentUser) {
        if (!clientAuth.currentUser.email) throw new Error("Email not found");
        const credential = EmailAuthProvider.credential(
          clientAuth.currentUser.email,
          oldPassword,
        );
        try {
          await reauthenticateWithCredential(
            clientAuth.currentUser,
            credential,
          );
        } catch {
          throw new Error("Incorrect old password");
        }
        await firebaseUpdatePassword(clientAuth.currentUser, newPassword);
      }
    },
    [],
  );

  const signInWithEmailAndPassword = useCallback(
    async (email: string, password: string) => {
      try {
        return await firebaseSignInWithEmailAndPassword(
          clientAuth,
          email,
          password,
        );
      } catch (error) {
        if (error instanceof FirebaseError) {
          throw handleFirebaseError(error.code);
        }
      }
    },
    [handleFirebaseError],
  );

  const signUpWithEmailAndPassword = useCallback(
    async (email: string, password: string) => {
      try {
        return await createUserWithEmailAndPassword(
          clientAuth,
          email,
          password,
        );
      } catch (error) {
        if (error instanceof FirebaseError) {
          throw handleFirebaseError(error.code);
        }
      }
    },
    [handleFirebaseError],
  );

  const sendPasswordResetEmail = useCallback(
    async (email: string) => {
      try {
        return await firebaseSendPasswordResetEmail(clientAuth, email);
      } catch (error) {
        if (error instanceof FirebaseError) {
          throw handleFirebaseError(error.code);
        }
      }
    },
    [handleFirebaseError],
  );

  return useMemo(
    () => ({
      isLoading,
      user,
      organizations,
      activeOrgId,
      signInWithEmailAndPassword,
      signUpWithEmailAndPassword,
      changeEmail,
      changePassword,
      signOut,
      isOrgAdmin,
      isPlatformAdmin,
      refresh,
      sendPasswordResetEmail,
      handleFirebaseError,
    }),
    [
      isLoading,
      user,
      organizations,
      activeOrgId,
      signInWithEmailAndPassword,
      signUpWithEmailAndPassword,
      changeEmail,
      changePassword,
      signOut,
      isOrgAdmin,
      isPlatformAdmin,
      refresh,
      sendPasswordResetEmail,
      handleFirebaseError,
    ],
  );
};

const [AuthContextProvider, useAuthContext] =
  scaffoldContext(useAuthContextValue);
export { AuthContextProvider, useAuthContext };

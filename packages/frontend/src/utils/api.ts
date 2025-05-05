import axios, { AxiosInstance, CreateAxiosDefaults, isAxiosError } from 'axios';
import { APIEndpoint, DefaultBody, PLATFORM_ADMIN_ORG } from 'common';
import { clientAuth } from '@/utils/firebase-client';

const baseURL = process.env.NEXT_PUBLIC_API_URL;

const createAxiosInstance = (
  organizationId?: number,
  options?: CreateAxiosDefaults,
): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    responseType: 'json',
    ...options,
  });

  instance.interceptors.request.use(async (request) => {
    const token = await clientAuth.currentUser?.getIdToken();
    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
      request.headers['organization-id'] = organizationId;
    }
    return request;
  });

  // instance.interceptors.request.use((request) => {
  //   console.log("Starting Request", JSON.stringify(request, null, 2));
  //   return request;
  // });
  //
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (isAxiosError(error) && error.response?.data?.error) {
        error.message = error.response.data.message;
      }
      throw error;
    },
  );

  return instance;
};

type GetApiEndpointParams = {
  organizationId?: number;
};

export const getAPI = (
  params?: GetApiEndpointParams,
  options?: CreateAxiosDefaults,
) => {
  const axiosInstance = createAxiosInstance(params?.organizationId, options);

  async function postCallback<
    ReqBody extends DefaultBody,
    ResBody extends DefaultBody,
  >(
    endpoint: APIEndpoint<ReqBody, ResBody>,
    requestBody?: ReqBody,
  ): Promise<ResBody | undefined> {
    const { data } = await axiosInstance.post<ResBody>(
      endpoint.path,
      requestBody,
    );

    return data;
  }

  return { post: postCallback, axios: axiosInstance };
};

export const getPlatformAdminAPI = () =>
  getAPI({ organizationId: PLATFORM_ADMIN_ORG.organizationId });

import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { DM_Sans } from "next/font/google";
import { QueryClient, QueryClientProvider } from "react-query";
import { ConfigProvider, App as AntdApp } from "antd";
import { AuthContextProvider } from "@/context/AuthContext";
import { OrganizationContextProvider } from "@/context/OrganizationContext";
import { AgentProvider } from "@/context/AgentContext";
import { RouteGuard } from "@/routing/RouteGuard";
import { themeConfig } from "@/utils/antd";
import { UploadDocumentProvider } from "@/context/UploadDocumentContext";
import Head from "next/head";
import { isAxiosError } from "axios";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry(failureCount, error) {
        if (isAxiosError(error)) {
          const status = error.response?.status;
          if (status === 403) {
            // stop retrying when endpoint requires higher authorization
            return false;
          }
        }
        return failureCount < 3;
      },
    },
  },
});

const dmSans = DM_Sans({
  weight: ["100", "300", "400", "500", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ConfigProvider theme={themeConfig}>
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <AuthContextProvider>
            <OrganizationContextProvider>
              <AgentProvider>
                <Head>
                  <link rel="icon" href="/icon.ico" />
                  <title>Centrus</title>
                </Head>
                <main id="main" className={dmSans.variable}>
                  <UploadDocumentProvider>
                    <RouteGuard>
                      <Component {...pageProps} />
                    </RouteGuard>
                  </UploadDocumentProvider>
                </main>
              </AgentProvider>
            </OrganizationContextProvider>
          </AuthContextProvider>
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

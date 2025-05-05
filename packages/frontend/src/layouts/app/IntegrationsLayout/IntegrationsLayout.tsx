import { FunctionComponent } from "react";
import { AppLayout } from "../AppLayout";
import { WhatsappIntegration } from "./WhatsappIntegration";
import { CustomIntegrationCard } from "./CustomIntegrationCard";
import { useOrganization } from "@/hooks/admin/useOrganization";

export type IntegrationsLayoutProps = object;

export const IntegrationsLayout: FunctionComponent<
  IntegrationsLayoutProps
> = () => {
  const { isLoading } = useOrganization();
  return (
    <AppLayout
      currentItemId={"integrations"}
      subtitle="Connect and manage external services"
      loading={isLoading}
    >
      <div className="container py-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CustomIntegrationCard />
          <WhatsappIntegration />
        </div>
      </div>
    </AppLayout>
  );
};

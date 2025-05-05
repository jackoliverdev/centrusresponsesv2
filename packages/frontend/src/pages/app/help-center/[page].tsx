import { NextPage } from "next";
import { HelpCenterLayout } from "@/layouts/app/HelpCenterLayout";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/router";
import React, { useMemo } from "react";
import { HELP_CENTER_TABS } from "@/routing/navigation/app";
import { Card, Segmented } from "antd";
import {
  FileTextIcon,
  LightbulbIcon,
  MessageCircleIcon,
  PlayCircleIcon,
} from "lucide-react";
import { HelpArticles } from "@/components/app/HelpCenter/HelpArticles";
import { HelpVideos } from "@/components/app/HelpCenter/HelpVideos";
import { HelpPrompts } from "@/components/app/HelpCenter/HelpPrompts";
import { HelpSupport } from '@/components/app/HelpCenter/HelpSupport';

const HelpCenterPage: NextPage = () => {
  const { isLoading, user } = useAuthContext();

  const router = useRouter();
  const { page } = router.query;

  const activeTab = useMemo(() => {
    if (typeof page !== "string" || isLoading || !user) {
      return null;
    }
    return HELP_CENTER_TABS?.find((t) => t.path === router.asPath) ?? null;
  }, [isLoading, router.asPath, page, user]);

  const icons = useMemo(
    () => ({
      articles: <FileTextIcon className="h-4 w-4" />,
      videos: <PlayCircleIcon className="h-4 w-4" />,
      prompts: <LightbulbIcon className="h-4 w-4" />,
      support: <MessageCircleIcon className="h-4 w-4" />,
    }),
    [],
  );

  return (
    <HelpCenterLayout>
      <div className="px-3 sm:px-6 @container flex flex-col relative">
        <Card classNames={{ body: "space-y-6" }}>
          {activeTab && (
            <>
              <Segmented
                block
                size="large"
                className="[&_.ant-segmented-item-icon]:inline-flex"
                value={activeTab.path}
                options={HELP_CENTER_TABS.map((tab) => ({
                  label: tab.name,
                  value: tab.path,
                  icon: icons[tab.id],
                }))}
                onChange={(path) => router.push(path)}
              />
              {activeTab.id === "articles" && <HelpArticles />}
              {activeTab.id === "videos" && <HelpVideos />}
              {activeTab.id === "prompts" && <HelpPrompts />}
              {activeTab.id === "support" && <HelpSupport />}
            </>
          )}
        </Card>
      </div>
    </HelpCenterLayout>
  );
};

export default HelpCenterPage;

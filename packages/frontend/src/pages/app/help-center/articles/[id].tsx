import { NextPage } from "next";
import { HelpCenterLayout } from "@/layouts/app/HelpCenterLayout";
import { ArticleDetails } from "@/components/app/HelpCenter/ArticleDetails";

const HelpCenterArticlePage: NextPage = () => {
  return (
    <HelpCenterLayout>
      <div className="px-3 sm:px-6 @container flex flex-col relative">
        <ArticleDetails />
      </div>
    </HelpCenterLayout>
  );
};

export default HelpCenterArticlePage;

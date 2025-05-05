import { NextPage } from "next";
import { HelpCenterLayout } from "@/layouts/app/HelpCenterLayout";
import { VideoDetails } from "@/components/app/HelpCenter/VideoDetails";

const HelpCenterVideoPage: NextPage = () => {
  return (
    <HelpCenterLayout>
      <div className="px-3 sm:px-6 @container flex flex-col relative">
        <VideoDetails />
      </div>
    </HelpCenterLayout>
  );
};

export default HelpCenterVideoPage;

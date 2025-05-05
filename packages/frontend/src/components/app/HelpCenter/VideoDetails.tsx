import React, { FunctionComponent } from "react";
import { Button, Card } from "antd";
import { ArrowLeftIcon } from "lucide-react";
import { useHelpContent } from "@/hooks/help-center/useHelpContent";
import { useRouter } from "next/router";
import { USER_APP_ROUTES } from "@/routing/routes";

type Props = object;

export const VideoDetails: FunctionComponent<Props> = () => {
  const router = useRouter();
  const id = Number(router.query.id);
  const { data: video, isLoading } = useHelpContent({ id, type: "video" });

  return (
    <Card loading={isLoading}>
      <div className="space-y-3">
        <Button
          variant="link"
          type="link"
          icon={<ArrowLeftIcon className="h-4 w-4 mr-2" />}
          onClick={() =>
            router.replace(USER_APP_ROUTES.getPath("helpCenterVideos"))
          }
        >
          Back to Videos
        </Button>
        {!video ? (
          <div>Video not found</div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="relative">
              <video
                controls
                className="w-full h-full"
                poster="/images/video-image.png"
              >
                <source src={video.content ?? undefined} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div>
              <span className="inline-block mb-4 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-600">
                {video.tag}
              </span>
              <h3 className="font-medium text-lg mt-1">{video.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{video.subtitle}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

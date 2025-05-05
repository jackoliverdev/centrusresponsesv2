import React, { FunctionComponent } from "react";
import { Button, Card } from "antd";
import Image from "next/image";
import Markdown from "react-markdown";
import { ArrowLeftIcon } from "lucide-react";
import { useHelpContent } from "@/hooks/help-center/useHelpContent";
import { useRouter } from "next/router";
import { USER_APP_ROUTES } from "@/routing/routes";

type Props = object;

export const ArticleDetails: FunctionComponent<Props> = () => {
  const router = useRouter();
  const id = Number(router.query.id);
  const { data: article, isLoading } = useHelpContent({ id, type: "article" });

  return (
    <Card loading={isLoading}>
      <div className="space-y-3">
        <Button
          variant="link"
          type="link"
          icon={<ArrowLeftIcon className="h-4 w-4 mr-2" />}
          onClick={() =>
            router.replace(USER_APP_ROUTES.getPath("helpCenterArticles"))
          }
        >
          Back to Articles
        </Button>
        {!article ? (
          <div>Article not found</div>
        ) : (
          <>
            <div className="relative">
              <Image
                src="/images/article-header.png"
                alt={article.titleExcerpt ?? ""}
                width={1920}
                height={384}
                className="rounded-lg object-cover w-full h-full"
              />
            </div>
            <div>
              <span className="inline-block mb-4 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-600">
                {article.tag}
              </span>
              <Markdown className="prose prose-blue">
                {article.content}
              </Markdown>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

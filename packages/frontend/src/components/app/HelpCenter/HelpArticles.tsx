import React, { FunctionComponent, useMemo, useState } from "react";
import { useHelpContents } from "@/hooks/help-center/useHelpContents";
import { Card } from "antd";
import Image from "next/image";
import { SearchFilter } from "@/components/ui/search-filter";
import { useRouter } from "next/router";
import { USER_APP_ROUTES } from "@/routing/routes";
import { Loading } from '@/components/common/Loading';

type Props = object;

export const HelpArticles: FunctionComponent<Props> = () => {
  const router = useRouter();
  const { data, isLoading } = useHelpContents({ type: "article" });
  const [query, setQuery] = useState("");

  const articles = useMemo(() => {
    const items = data ?? [];
    if (!query) {
      return items;
    }

    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
        item.content?.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query, data]);

  return (
    <>
      <SearchFilter
        searchText={query}
        placeholder="Search articles"
        onSetSearchText={setQuery}
      />

      {isLoading && <Loading />}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {articles.map((article) => (
          <Card
            key={article.id}
            loading={isLoading}
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            classNames={{ body: "!p-4" }}
            onClick={() =>
              router.push(
                `${USER_APP_ROUTES.getPath("helpCenterArticles")}/${article.id}`,
              )
            }
          >
            <div className="space-y-3">
              <div className="relative aspect-video">
                <Image
                  src="/images/article-image.png"
                  alt={article.titleExcerpt ?? ""}
                  width={1280}
                  height={720}
                  className="rounded-lg object-cover w-full h-full"
                />

                <div className="absolute top-0 w-full h-full flex items-center justify-center">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-primary max-w-[90%] lg:max-w-[60%] text-center">
                    {article.titleExcerpt}
                  </h2>
                </div>
              </div>
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-600">
                  {article.tag}
                </span>
                <h3 className="font-medium text-lg mt-1">{article.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{article.subtitle}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
};

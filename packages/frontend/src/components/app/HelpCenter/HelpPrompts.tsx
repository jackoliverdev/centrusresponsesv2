import React, {
  FunctionComponent,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useHelpContents } from "@/hooks/help-center/useHelpContents";
import { App, Button, Card } from "antd";
import { SearchFilter } from "@/components/ui/search-filter";
import { LightbulbIcon } from "lucide-react";
import copy from "copy-to-clipboard";
import { Loading } from "@/components/common/Loading";

type Props = object;

export const HelpPrompts: FunctionComponent<Props> = () => {
  const { message } = App.useApp();
  const { data, isLoading } = useHelpContents({ type: "prompt" });
  const [activeTag, setActiveTag] = useState("All");
  const [query, setQuery] = useState("");
  const [copyingPromptIds, setCopyingPromptIds] = useState<
    Record<number, boolean>
  >({});

  const prompts = useMemo(() => {
    let items = data ?? [];

    if (query) {
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.content?.toLowerCase().includes(query.toLowerCase()),
      );
    }

    if (activeTag !== "All") {
      items = items.filter((item) => item.title === activeTag);
    }

    return items;
  }, [data, query, activeTag]);

  const tags = useMemo(() => {
    const items = data ?? [];

    return Array.from(new Set(items.map((item) => item.title)));
  }, [data]);

  const handleCopy = useCallback(
    (text: string, id: number) => {
      const copied = copy(text);

      if (copied) {
        setCopyingPromptIds((prev) => ({ ...prev, [id]: true }));
        void message.success("Copied to clipboard!");
        setTimeout(() => {
          setCopyingPromptIds((prev) => ({ ...prev, [id]: false }));
        }, 1000);
      } else {
        void message.error("Failed to copy to clipboard!");
      }
    },
    [message],
  );

  return (
    <>
      <SearchFilter
        searchText={query}
        placeholder="Search prompts"
        onSetSearchText={setQuery}
      />

      {isLoading ? (
        <Loading />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            value="All"
            type={activeTag === "All" ? "primary" : "default"}
            onClick={() => setActiveTag("All")}
          >
            All
          </Button>
          {tags.map((tag, i) => (
            <Button
              key={i}
              value={tag}
              type={activeTag === tag ? "primary" : "default"}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {prompts.map((prompt) => (
          <Card
            key={prompt.id}
            loading={isLoading}
            className="overflow-hidden"
            classNames={{ body: "!p-4" }}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-primary-light">
                  <LightbulbIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{prompt.title}</p>
                  <p className="text-xs text-gray-500">{prompt.subtitle}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600">{prompt.content}</p>

              <Button
                variant={copyingPromptIds[prompt.id] ? "solid" : "outlined"}
                color="primary"
                block
                onClick={() =>
                  prompt.content
                    ? handleCopy(prompt.content, prompt.id)
                    : undefined
                }
              >
                {copyingPromptIds[prompt.id] ? "Prompt Copied!" : "Copy Prompt"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
};

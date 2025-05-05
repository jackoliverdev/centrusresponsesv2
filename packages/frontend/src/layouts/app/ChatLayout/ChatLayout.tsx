import { FunctionComponent, useCallback, useMemo, useState } from "react";
import { AppLayout } from "../AppLayout";
import { Input } from "@/components/ui/input";
import { twMerge } from "tailwind-merge";
import { Chat } from "./Chat";
import { useChats } from "@/hooks/chat/useChats";
import { useAuthContext } from "@/context/AuthContext";
import { Loading } from "@/components/common/Loading";
import { NewChatButton } from "./NewChatButton";
import { ArchiveIcon, FolderPlusIcon, MoveIcon, PinIcon, CheckSquareIcon, XCircleIcon } from "lucide-react";
import { SortDropdown } from "./SortDropdown";
import { Tooltip, Tabs, Button, message, Modal, Dropdown } from "antd";
import { getUserLabel } from "@/utils/user";
import { SortOrderDropdown } from "./SortOrderDropdown";
import { ChatSchema } from "common";
import { usePinnedThreads } from "@/hooks/chat/usePinnedThreads";
import { ThreadItem } from "@/components/app/Chat/Thread";
import { ThreadFolderList } from "@/components/app/Chat/ThreadFolderList";
import { useThreadFolders } from "@/hooks/chat/useThreadFolders";
import { useReorderThreadPin } from "@/hooks/chat/useReorderThreadPin";
import { ChatContextProvider } from "@/context/ChatContext";
import { CreateThreadFolderModal } from "@/components/app/Chat/CreateThreadFolderModal";
import { useBulkAttachThreadToFolder } from "@/hooks/chat/useBulkAttachThreadToFolder";
import { useBulkPinThreads } from "@/hooks/chat/useBulkPinThreads";
import { useBulkUnpinThreads } from "@/hooks/chat/useBulkUnpinThreads";
import { useBulkUpdateChat } from "@/hooks/chat/useBulkUpdateChat";
import { DownOutlined } from "@ant-design/icons";

export type ChatLayoutProps = object;

const sorts = [
  {
    name: "Date",
    key: "date",
    sortFn: (
      a: { modified_at: ChatSchema["modified_at"] },
      b: { modified_at: ChatSchema["modified_at"] },
    ) => new Date(a.modified_at).valueOf() - new Date(b.modified_at).valueOf(),
    labels: {
      ascending: "Oldest",
      descending: "Newest",
    },
  },
  {
    name: "Chat Name",
    key: "name",
    sortFn: (
      a: { name: ChatSchema["name"] },
      b: { name: ChatSchema["name"] },
    ) => a.name.localeCompare(b.name),
    labels: {
      ascending: "A-Z",
      descending: "Z-A",
    },
  },
  {
    name: "User",
    key: "user",
    sortFn: (
      a: { user: ChatSchema["user"] },
      b: { user: ChatSchema["user"] },
    ) => getUserLabel(a.user).localeCompare(getUserLabel(b.user)),
    labels: {
      ascending: "A-Z",
      descending: "Z-A",
    },
  },
  {
    name: "Tag",
    key: "tag",
    sortFn: (a: { tag: ChatSchema["tag"] }, b: { tag: ChatSchema["tag"] }) =>
      (a.tag.name || "").localeCompare(b.tag.name || ""),
    labels: {
      ascending: "A-Z",
      descending: "Z-A",
    },
  },
];

export const ChatLayout: FunctionComponent<ChatLayoutProps> = () => {
  const { user: currentUser } = useAuthContext();
  const {
    data: folders = [],
    isLoading: isLoadingFolders,
    isError: isFoldersError,
  } = useThreadFolders();
  const { data: chats = [], isLoading: isLoadingChats } = useChats();
  const { orderMap, isPinned, isLowestPin, isHighestPin, pinnedThreads } =
    usePinnedThreads();
  const { mutate: reorderPins, isLoading: isReordering } =
    useReorderThreadPin();
  const { mutate: bulkAttachToFolder, isLoading: isAttachingToFolder } = 
    useBulkAttachThreadToFolder();
  const { mutate: bulkPinThreads, isLoading: isPinningThreads } =
    useBulkPinThreads();
  const { mutate: bulkUnpinThreads, isLoading: isUnpinningThreads } =
    useBulkUnpinThreads();
  const { mutate: bulkUpdateChat, isLoading: isUpdatingChats } =
    useBulkUpdateChat();
  const [selectedFolderId, setSelectedFolderId] = useState<number>();
  const [selectedThreadId, setSelectedThreadId] = useState<string>();
  const [selectedTab, setSelectedTab] = useState(currentUser?.is_teamleader ? "Personal" : "Chat history");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [sort, setSort] = useState(sorts[0].key);
  const [ascending, setAscending] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const { sortFn, labels: sortLabels } = useMemo(
    () => sorts.find(({ key }) => key == sort) || sorts[0],
    [sort],
  );

  const foldersMap = useMemo(
    () =>
      (folders ?? []).reduce(
        (acc, curr) => ({
          ...acc,
          [curr.id]: curr.threads.map(({ id }) => id),
        }),
        {} as Record<number, string[]>,
      ),
    [folders],
  );

  const searchedThreads = useMemo(() => {
    let filteredThreads = chats;
    if (currentUser?.is_teamleader) {
      if (selectedTab === "Agents") {
        filteredThreads = chats.filter((chat) => chat.agent_run);
      } else {
        filteredThreads = chats.filter((chat) => {
          if (chat.agent_run) return false;
          if (selectedTab === "All") return true;
          return chat.type === selectedTab;
        });
      }
    } else {
      if (selectedTab === "Agent history") {
        filteredThreads = chats.filter((chat) => chat.agent_run);
      } else {
        filteredThreads = chats.filter((chat) => !chat.agent_run);
      }
    }
    filteredThreads = filteredThreads
      .filter(({ archived }) => archived == showArchived)
      .filter(({ id }) =>
        !selectedFolderId || foldersMap[selectedFolderId]?.includes(id),
      );

    const sortedThreads = filteredThreads
      .filter(({ user, ...thread }) => {
        const searchTerm = search.toLowerCase();
        return (
          searchTerm == "" ||
          thread.name?.toLowerCase().includes(searchTerm) ||
          thread.last_message?.toLowerCase().includes(searchTerm) ||
          thread.tag?.name?.toLowerCase().includes(searchTerm) ||
          getUserLabel(user).toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm)
        );
      })
      .sort(sortFn);

    const pinnedChats = sortedThreads
      .filter((chat) => isPinned(chat.id))
      .sort((a, b) => {
        const orderA = orderMap[a.id];
        const orderB = orderMap[b.id];
        return orderA - orderB;
      });

    const unpinnedChats = sortedThreads.filter((chat) => !isPinned(chat.id));

    if (ascending) return [...pinnedChats, ...unpinnedChats];
    return [...pinnedChats, ...unpinnedChats.reverse()];
  }, [
    chats,
    sortFn,
    ascending,
    selectedTab,
    showArchived,
    selectedFolderId,
    foldersMap,
    search,
    isPinned,
    orderMap,
  ]);

  const canModifyChat = useCallback(
    (chatUserId: number) => {
      return currentUser?.id === chatUserId;
    },
    [currentUser?.id],
  );

  const onReorderThreadPins = useCallback(
    (itemId: string, newIndex: number) => {
      const threads = pinnedThreads ?? [];

      if (threads.length === 0) {
        return;
      }

      const newThreads = threads.filter(({ threadId }) => threadId !== itemId);
      const thread = threads.find(({ threadId }) => threadId === itemId);

      if (!thread) {
        return;
      }

      newThreads.splice(newIndex, 0, thread);

      reorderPins(
        newThreads.map((t, i) => ({ ...t, order: i + 1 })),
        {
          onSuccess: () => {
            return void message.success("Thread reordered successfully.");
          },
          onError: () =>
            void message.error("Failed to reorder thread. Please try again"),
        },
      );
    },
    [pinnedThreads, reorderPins],
  );

  const toggleThreadSelection = useCallback((threadId: string) => {
    setSelectedThreadIds(prev => 
      prev.includes(threadId) 
        ? prev.filter(id => id !== threadId)
        : [...prev, threadId]
    );
  }, []);

  const handleThreadClick = useCallback((threadId: string) => {
    if (isSelectMode) {
      toggleThreadSelection(threadId);
    } else {
      setSelectedThreadId(threadId);
    }
  }, [isSelectMode, toggleThreadSelection]);

  const handleAddToFolder = useCallback((folderId: number) => {
    if (selectedThreadIds.length === 0) return;
    
    bulkAttachToFolder(
      { threadIds: selectedThreadIds, folderId, folders },
      {
        onSuccess: () => {
          setSelectedThreadIds([]);
          setIsSelectMode(false);
        }
      }
    );
  }, [bulkAttachToFolder, selectedThreadIds, folders]);

  const handleBulkPin = useCallback(() => {
    if (selectedThreadIds.length === 0) return;
    
    // Filter out already pinned threads
    const unpinnedThreadIds = selectedThreadIds.filter(id => !isPinned(id));
    if (unpinnedThreadIds.length === 0) {
      message.info("All selected threads are already pinned");
      return;
    }
    
    bulkPinThreads(
      { threadIds: unpinnedThreadIds },
      {
        onSuccess: () => {
          setSelectedThreadIds([]);
          setIsSelectMode(false);
        }
      }
    );
  }, [bulkPinThreads, selectedThreadIds, isPinned]);

  const handleBulkUnpin = useCallback(() => {
    if (selectedThreadIds.length === 0) return;
    
    // Filter for only pinned threads
    const pinnedThreadIds = selectedThreadIds.filter(id => isPinned(id));
    if (pinnedThreadIds.length === 0) {
      message.info("None of the selected threads are pinned");
      return;
    }
    
    bulkUnpinThreads(
      { threadIds: pinnedThreadIds },
      {
        onSuccess: () => {
          setSelectedThreadIds([]);
          setIsSelectMode(false);
        }
      }
    );
  }, [bulkUnpinThreads, selectedThreadIds, isPinned]);

  const handleBulkArchive = useCallback(() => {
    if (selectedThreadIds.length === 0) return;
    
    bulkUpdateChat(
      { ids: selectedThreadIds, data: { archived: true } },
      {
        onSuccess: () => {
          setSelectedThreadIds([]);
          setIsSelectMode(false);
        }
      }
    );
  }, [bulkUpdateChat, selectedThreadIds]);

  const handleBulkUnarchive = useCallback(() => {
    if (selectedThreadIds.length === 0) return;
    
    bulkUpdateChat(
      { ids: selectedThreadIds, data: { archived: false } },
      {
        onSuccess: () => {
          setSelectedThreadIds([]);
          setIsSelectMode(false);
        }
      }
    );
  }, [bulkUpdateChat, selectedThreadIds]);

  return (
    <>
      <AppLayout
        currentItemId="chat"
        subtitle="Start conversations with AI-powered assistance"
        className="lg:gap-y-0 gap-y-0 pb-0 self-stretch min-h-0"
        containerClassName="h-screen"
        headerClassName={selectedThreadId ? "hidden lg:block" : ""}
        action={<NewChatButton onSuccess={(id) => setSelectedThreadId(id)} />}
      >
        <ChatContextProvider>
          <div className="flex bg-gray-100 flex-1 min-h-0">
            <div
              className={twMerge(
                "w-full lg:w-1/3 bg-white border-r border-gray-200 flex flex-col px-2 lg:px-4",
                selectedThreadId && "hidden lg:flex",
              )}
            >
              <div className="flex items-stretch gap-2 py-2 lg:py-4">
                <Input
                  type="search"
                  placeholder="Search chats, messages, and people..."
                  className="flex-1 text-sm lg:text-base h-9 lg:h-10 min-h-0"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Tooltip
                  title={
                    showArchived ? "Show unarchived chats" : "Show archived chats"
                  }
                >
                  <button
                    className={twMerge(
                      "h-9 lg:h-10 w-9 lg:w-10 border transition aspect-square flex items-center justify-center rounded-lg text-neutral-400",
                      showArchived &&
                        "border-secondary text-secondary bg-secondary/20",
                    )}
                    onClick={() => setShowArchived(!showArchived)}
                  >
                    <ArchiveIcon />
                  </button>
                </Tooltip>
              </div>

              {/* Folder section with tighter spacing */}
              <div className="mb-1 lg:mb-2 max-h-[30%] custom-scroll">
                <div className="flex items-center justify-between px-2 mb-1">
                  <h3 className="text-sm font-medium">Folders</h3>
                  <Button
                    type="text"
                    size="small"
                    icon={<FolderPlusIcon className="w-4 h-4" />}
                    onClick={() => setIsCreatingFolder(true)}
                  />
                </div>
                <ThreadFolderList
                  chats={chats}
                  folders={folders}
                  isLoading={isLoadingFolders}
                  isError={isFoldersError}
                  selectedFolderId={selectedFolderId}
                  onFolderSelect={setSelectedFolderId}
                  onChatSelect={setSelectedThreadId}
                  className="py-0.5 lg:py-2"
                />
              </div>

              {selectedFolderId && (
                <div className="mb-1 lg:mb-2">
                  <Button
                    type="text"
                    size="small"
                    color="danger"
                    className="text-red-400 hover:!text-red-500 text-xs h-7 lg:h-8"
                    onClick={() => setSelectedFolderId(undefined)}
                  >
                    Clear folder filter
                  </Button>
                </div>
              )}

              {/* Bulk Actions Section - Streamlined */}
              {(!currentUser?.is_teamleader || selectedTab === "Personal") && searchedThreads.length > 0 && (
                <div className="mb-3">
                  {isSelectMode ? (
                    <div className="flex items-center gap-2 px-2">
                      <div className="text-sm text-blue-700 font-medium mr-auto">
                        Selected: {selectedThreadIds.length}
                      </div>
                      <Button
                        size="small"
                        className="text-gray-700 transition-none focus:outline-none"
                        style={{ transition: 'none' }}
                        onClick={() => {
                          if (selectedThreadIds.length === searchedThreads.length) {
                            setSelectedThreadIds([]);
                          } else {
                            setSelectedThreadIds(searchedThreads.map(thread => thread.id));
                          }
                          // Remove focus to prevent focus animation
                          (document.activeElement as HTMLElement)?.blur();
                        }}
                      >
                        {selectedThreadIds.length === searchedThreads.length ? 'Deselect All' : 'Select All'}
                      </Button>

                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'folder',
                              label: 'Add to folder',
                              icon: <MoveIcon className="w-3 h-3 relative" style={{ top: '4px' }} />,
                              disabled: selectedThreadIds.length === 0,
                              children: folders.map(folder => ({
                                key: `folder-${folder.id}`,
                                label: folder.name,
                                onClick: () => handleAddToFolder(folder.id)
                              })),
                            },
                            {
                              key: 'archive',
                              label: showArchived ? 'Unarchive' : 'Archive',
                              icon: <ArchiveIcon className="w-3 h-3" />,
                              disabled: selectedThreadIds.length === 0,
                              onClick: () => showArchived ? handleBulkUnarchive() : handleBulkArchive(),
                            },
                            {
                              key: 'pin',
                              label: 'Pin',
                              icon: <PinIcon className="w-3 h-3" />,
                              disabled: selectedThreadIds.length === 0,
                              onClick: () => handleBulkPin(),
                            },
                            {
                              key: 'unpin',
                              label: 'Unpin',
                              icon: <XCircleIcon className="w-3 h-3" />,
                              disabled: selectedThreadIds.length === 0,
                              onClick: () => handleBulkUnpin(),
                            },
                          ],
                        }}
                        trigger={['click']}
                        disabled={selectedThreadIds.length === 0}
                      >
                        <Button
                          type="primary"
                          size="small"
                          loading={isAttachingToFolder || isPinningThreads || isUnpinningThreads || isUpdatingChats}
                        >
                          Actions <DownOutlined />
                        </Button>
                      </Dropdown>
                      
                      <Button 
                        size="small"
                        danger
                        onClick={() => {
                          setIsSelectMode(false);
                          setSelectedThreadIds([]);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-2 mb-1">
                      <h3 className="text-sm font-medium">Bulk Actions</h3>
                      <Button
                        size="small"
                        shape="round"
                        type="default"
                        className="text-gray-700 border-gray-300 hover:bg-gray-100"
                        icon={<CheckSquareIcon className="w-3.5 h-3.5 text-gray-700 mr-1" />}
                        onClick={() => setIsSelectMode(true)}
                      >
                        Select Multiple
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 px-2">
                <SortDropdown options={sorts} value={sort} onChange={setSort} />
                <SortOrderDropdown
                  labels={sortLabels}
                  ascending={ascending}
                  onChange={setAscending}
                />
              </div>
              {currentUser?.is_teamleader ? (
                <>
                  <div className="-mb-4">
                    <Tabs
                      defaultActiveKey="Personal"
                      onChange={(tab) => {
                        setSelectedTab(tab);
                        setIsSelectMode(false);
                        setSelectedThreadIds([]);
                      }}
                      items={["All", "Personal", "Team", "Agents"].map((key) => ({
                        key,
                        label: key === "Agents" ? "Agents" : key,
                      }))}
                    />
                  </div>
                  <div className="text-xs text-gray-500 px-3 py-0 mt-1.5 mb-1.5">
                    {selectedTab === "All" && "Your chats and your team members' chats, excluding agent-generated threads."}
                    {selectedTab === "Personal" && "Chats you have created, excluding agent-generated threads."}
                    {selectedTab === "Team" && "Chats created by your team members, excluding agent-generated threads."}
                    {selectedTab === "Agents" && "All agent-generated threads for your organisation."}
                  </div>
                </>
              ) : (
                <>
                  <div className="-mb-4">
                    <Tabs
                      defaultActiveKey="Chat history"
                      onChange={(tab) => {
                        setSelectedTab(tab);
                        setIsSelectMode(false);
                        setSelectedThreadIds([]);
                      }}
                      items={["Chat history", "Agent history"].map((key) => ({
                        key,
                        label: key,
                      }))}
                    />
                  </div>
                  <div className="text-xs text-gray-500 px-3 py-0 mt-1.5 mb-1.5">
                    {selectedTab === "Chat history" && "Your personal chat history, excluding agent-generated threads."}
                    {selectedTab === "Agent history" && "All agent-generated threads for your organisation."}
                  </div>
                </>
              )}
              <div className="overflow-y-auto flex-1 custom-scroll">
                {isLoadingChats && <Loading className="h-32" />}
                <div>
                  {!isLoadingChats && chats.length == 0 && (
                    <div className="text-center text-2xl font-semibold text-neutral-400 py-24">
                      No chats.
                    </div>
                  )}

                  {!isLoadingChats &&
                    chats.length !== 0 &&
                    searchedThreads.length === 0 &&
                    showArchived && (
                      <div className="text-center text-xl lg:text-2xl font-semibold text-neutral-400 py-12 lg:py-24">
                        No archived chats.
                      </div>
                    )}

                  {/* Conversation list items */}
                  {searchedThreads.map((thread, index) => {
                    const threadIsPinned = isPinned(thread.id);
                    const isOwner = canModifyChat(thread.user_id);
                    const isFirstPin = isHighestPin(thread.id);
                    const isLastPin = isLowestPin(thread.id);
                    const isSelected = selectedThreadIds.includes(thread.id);
                    // Only enable selection for non-team leaders or team leaders in Personal tab
                    const isSelectionEnabled = !currentUser?.is_teamleader || selectedTab === "Personal";

                    return (
                      <div 
                        key={thread.id}
                        className={twMerge(
                          isSelectMode && isSelected && "bg-blue-50"
                        )}
                      >
                        <ThreadItem
                          key={thread.id}
                          data={thread}
                          selectedThreadId={selectedThreadId}
                          isOwner={isOwner}
                          isFirstPin={isFirstPin}
                          isLastPin={isLastPin}
                          isThreadPinned={threadIsPinned}
                          onSelect={handleThreadClick}
                          isReordering={isReordering}
                          isSelectMode={isSelectMode && isSelectionEnabled}
                          isSelected={isSelected}
                          onReorder={(dir) =>
                            onReorderThreadPins(
                              thread.id,
                              dir === "up" ? index - 1 : index + 1,
                            )
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main chat area */}
            <div
              className={twMerge(
                "lg:block flex-1",
                !selectedThreadId && "hidden",
              )}
            >
              <Chat
                threadId={selectedThreadId}
                onBack={() => setSelectedThreadId(undefined)}
                key={selectedThreadId}
              />
            </div>
          </div>
        </ChatContextProvider>
      </AppLayout>
      
      <CreateThreadFolderModal
        open={isCreatingFolder}
        onClose={() => setIsCreatingFolder(false)}
        onSuccess={(newFolderId) => {
          setSelectedFolderId(newFolderId);
        }}
      />
    </>
  );
};

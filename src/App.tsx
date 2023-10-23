import { useMemo, useState, useRef, useCallback } from "react";
import "./App.css";

import { MemoryStorage, TriplitClient } from "@triplit/client";
import { useQuery } from "@triplit/react";
import { nanoid } from "nanoid";

const client = new TriplitClient({
  // sync: {
  //   server: import.meta.env.VITE_TRIPLIT_SERVER,
  //   secure: false,
  // },
  db: {
    storage: { cache: new MemoryStorage(), outbox: new MemoryStorage() },
  },
  auth: {
    token: import.meta.env.VITE_TRIPLIT_API_KEY,
  },
});
client.syncEngine.disconnect();
// @ts-ignore
window.client = client;

const chatsQuery = client.query("chats");

function getUserId() {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = nanoid();
    localStorage.setItem("userId", userId);
  }
  return userId;
}

const userId = getUserId();

function App() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  const { results: chats, fetching, error } = useQuery(client, chatsQuery);

  if (fetching) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="flex h-screen w-screen bg-gray-100">
      <div className="w-1/3 p-4 bg-white overflow-auto">
        <h2 className="text-xl font-bold mb-4">Chats</h2>
        <button
          onClick={async () => {
            await client.insert("chats", { name: "New Chat" });
          }}
        >
          New
        </button>
        {[...(chats?.entries() ?? [])].map(([id, chat]) => (
          <ChatListing
            key={id}
            onSelect={() => setSelectedChat(id)}
            chat={chat}
            chatId={id}
            isSelected={selectedChat === id}
          />
        ))}
      </div>
      <div className="w-2/3 p-4">
        {selectedChat ? <ChatArea chatId={selectedChat} /> : <EmptyMessage />}
      </div>
    </div>
  );
}

function ChatListing({
  isSelected,
  chat,
  chatId,
  onSelect,
}: {
  isSelected: boolean;
  chat: any;
  chatId: string;
  onSelect: () => void;
}) {
  const [editMode, setEditMode] = useState<boolean>(false);
  const [draftName, setDraftName] = useState<string>(chat.name);
  const snippetQuery = useMemo(() => {
    return client
      .query("messages")
      .where([["chatId", "=", chatId]])
      .order(["createdAt", "DESC"])
      .limit(1);
  }, [chatId]);

  const { fetching: fetchingSnippet, results: snippetResults } = useQuery(
    client,
    snippetQuery
  );
  const snippet =
    [...(snippetResults?.entries() ?? [])][0]?.[1]?.text ?? "No messages";
  return (
    <div className="flex mb-2">
      {editMode ? (
        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
        />
      ) : (
        <div
          className={`grow p-2 rounded  ${
            isSelected ? "bg-blue-300" : "bg-blue-100"
          }`}
          onClick={onSelect}
        >
          {chat.name} - {fetchingSnippet ? "..." : snippet}
        </div>
      )}
      {editMode ? (
        <button
          onClick={async () => {
            await client.update("chats", chatId, async (entity) => {
              entity.name = draftName;
            });
            setEditMode(false);
          }}
        >
          Save
        </button>
      ) : (
        <button onClick={() => setEditMode(true)}>Edit</button>
      )}
    </div>
  );
}

function EmptyMessage() {
  return (
    <div>
      <p>Click on a chat to start messaging!</p>
    </div>
  );
}

const PAGE_SIZE = 20;

function ChatArea({ chatId }: { chatId: string }) {
  const [messageLimit, setMessageLimit] = useState(PAGE_SIZE);
  const allMessagesQuery = useMemo(() => {
    return client
      .query("messages")
      .where([["chatId", "=", chatId]])
      .order(["createdAt", "DESC"])
      .limit(messageLimit);
  }, [chatId, messageLimit]);

  const pendingMessagesQuery = useMemo(() => {
    return client
      .query("messages")
      .where([["chatId", "=", chatId]])
      .order(["createdAt", "DESC"])
      .limit(messageLimit)
      .syncStatus("pending");
  }, [chatId, messageLimit]);

  const { results: allMessages } = useQuery(client, allMessagesQuery);
  const { results: pendingMessages } = useQuery(client, pendingMessagesQuery);

  const [input, setInput] = useState("");
  const scroll = useRef<HTMLSpanElement>();
  const messagesConainerRef = useRef<HTMLDivElement>();

  const onScroll = useCallback(() => {
    if (
      messagesConainerRef.current &&
      messagesConainerRef.current.scrollTop === 0
    ) {
      // TODO: cap message limit updates (if result set size is less than PAGE_SIZE * page)
      setMessageLimit((prev) => prev + PAGE_SIZE);
    }
  }, []);

  return (
    <div className="h-full flex flex-col justify-between">
      <div
        className="overflow-auto"
        onScroll={onScroll}
        ref={messagesConainerRef}
      >
        {[...(allMessages?.entries() ?? [])].reverse().map(([id, message]) => (
          <div
            key={id}
            className={`rounded px-4 py-2 mb-2 ${
              message.user === userId ? "bg-blue-200" : "bg-green-200"
            }`}
          >
            <p className="font-bold">{message.user}</p>
            <p>{message.text}</p>
            <p>{pendingMessages?.has(id) ? "unsent" : "sent"}</p>
          </div>
        ))}
        <span ref={scroll}></span>
      </div>
      <form
        className="flex"
        onSubmit={async (e) => {
          e.preventDefault();
          await client.insert("messages", {
            chatId,
            text: input,
            user: userId,
            createdAt: new Date().toISOString(),
          });
          setInput("");
          setTimeout(() => {
            scroll.current?.scrollIntoView({ behavior: "smooth" });
          }, 0);
        }}
      >
        <input
          className="w-full rounded p-2 border"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default App;

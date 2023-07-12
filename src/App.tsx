import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

type Message = {
  id: number;
  text: string;
  user: string;
};

const initialMessages: Message[] = [
  { id: 1, text: "Hello!", user: "User1" },
  { id: 2, text: "Hi!", user: "User2" },
];

function App() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  return (
    <div className="flex h-screen w-screen bg-gray-100">
      <div className="w-1/3 p-4 bg-white overflow-auto">
        {/* This is where the chat list goes */}
        <h2 className="text-xl font-bold mb-4">Chats</h2>
        <div className="p-2 bg-blue-100 rounded mb-2">Chat 1</div>
        <div className="p-2 bg-blue-100 rounded mb-2">Chat 2</div>
        {/* add more chats here */}
      </div>
      <div className="w-2/3 p-4">
        {/* This is where the messages go */}
        <div className="h-full flex flex-col justify-between">
          <div className="overflow-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded px-4 py-2 mb-2 ${
                  message.user === "User1" ? "bg-blue-200" : "bg-green-200"
                }`}
              >
                <p className="font-bold">{message.user}</p>
                <p>{message.text}</p>
              </div>
            ))}
          </div>
          <div className="flex">
            {/* This is the message input */}
            <input
              className="w-full rounded p-2 border"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
            />
            <button
              onClick={() => {
                setMessages([
                  ...messages,
                  { id: messages.length + 1, text: input, user: "User1" },
                ]);
                setInput("");
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatArea() {
  return (
    <div>
      <div></div>
      <div>
        <input />
      </div>
    </div>
  );
}

export default App;

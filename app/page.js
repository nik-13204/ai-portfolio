"use client";
import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const res = await fetch(process.env.NEXT_PUBLIC_API_URL, {
      method: "POST",
      body: JSON.stringify({ messages: newMessages }),
      headers: { "Content-Type": "application/json" },
    });

    const botReply = await res.text();
    setMessages([...newMessages, { role: "assistant", content: botReply }]);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black relative overflow-hidden text-white font-mono">
      {/* Star Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="stars"></div>
        <div className="twinkling"></div>
      </div>

      <div className="relative z-10 px-4 w-full h-screen flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-bold mt-10 text-purple-300 drop-shadow-lg text-center">
          ✨ Nikhil's AI Portfolio
        </h1>

        {/* Message Area */}
        <section className="w-full max-w-3xl mt-8 mb-4 flex-1 overflow-y-auto px-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 my-2 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && <div className="text-2xl">🤖</div>}
              <div
                className={`max-w-sm px-4 py-2 rounded-xl whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-700 self-end"
                    : "bg-purple-700 self-start"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && <div className="text-2xl">👤</div>}
            </div>
          ))}

          {loading && (
            <div className="animate-pulse italic text-purple-300 mt-2">
              Assistant is typing...
            </div>
          )}
        </section>

        {/* Input */}
        <form
          className="w-full max-w-3xl flex gap-2 mb-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <input
            type="text"
            name="message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something..."
            className="flex-1 px-4 py-3 rounded-lg text-white text-xl focus:outline-none border-2 border-purple-400 focus:border-purple-600"
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-lg"
          >
            Submit
          </button>
        </form>
      </div>
    </main>
  );
}

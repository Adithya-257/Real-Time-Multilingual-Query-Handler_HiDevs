"use client";

import { useState, useRef, useEffect } from "react";
import { Newsreader } from "next/font/google";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "700"],
});

  export default function Home() {

  // ⭐ FLAG EMOJI FUNCTION
  function getFlag(lang) {
    const flags = {
      en: "🇬🇧",
      es: "🇪🇸",
      fr: "🇫🇷",
      hi: "🇮🇳",
      ar: "🇸🇦",
      zh: "🇨🇳",
      de: "🇩🇪",
      it: "🇮🇹",
      ja: "🇯🇵",
      ko: "🇰🇷",
      ru: "🇷🇺",
      pt: "🇵🇹",
      bn: "🇧🇩",
      ur: "🇵🇰",
      ta: "🇱🇰",
      te: "🇮🇳",
      kn: "🇮🇳",
      ml: "🇮🇳",
      cy: "🏴",
    };
    return flags[lang] || "🏳️";
  }

  // ⭐ FULL LANGUAGE NAME (from backend)
  function getLanguageNameByFrontend(msg) {
    return msg.languageName || msg.lang || "Unknown";
  }

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const chatBoxRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const box = chatBoxRef.current;
    if (!box) return;

    const handleScroll = () => {
      const atBottom = Math.abs(box.scrollHeight - box.scrollTop - box.clientHeight) < 5;
      setShowScrollButton(!atBottom);
    };

    box.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => box.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    const box = chatBoxRef.current;
    if (box) box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  };

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { who: "user", text: userText }]);
    setTimeout(scrollToBottom, 50);

    setIsTyping(true);
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userText }),
      });

      const data = await res.json();

      setIsTyping(false);

      setMessages((prev) => [
        ...prev,
        {
          who: "bot",
          text: data.answer,
          lang: data.detected_language,
          languageName: data.language_name,
          originalEnglish: data.english_query,
          showTranslated: false,
        }
      ]);

      setTimeout(scrollToBottom, 100);

    } catch (err) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { who: "bot", text: "Error: could not reach backend." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // toggle translation visibility
  function toggleTranslation(index) {
    setMessages((prev) =>
      prev.map((msg, i) =>
        i === index ? { ...msg, showTranslated: !msg.showTranslated } : msg
      )
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex flex-col items-center py-10 px-4 text-white">

      <h1 className={`${newsreader.className} text-4xl font-bold mb-8 text-center`}>
        MultiLingual Query Handler
      </h1>

      <div className="w-full max-w-2xl bg-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-xl shadow-xl p-5">

        {/* Chat window */}
        <div
          ref={chatBoxRef}
          className="relative h-[480px] overflow-y-auto border border-gray-700 rounded p-4 bg-gray-800/60"
        >
          {messages.map((msg, i) => (
            <div key={i} className="my-2">
              <div
                className={`p-3 rounded-lg max-w-[85%] break-words ${
                  msg.who === "user"
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-gray-600 text-white mr-auto"
                }`}
              >
                {msg.text}

                {/* Show language tag for bot only */}
                {msg.who === "bot" && msg.lang && (
                  <div className="text-xs mt-1 opacity-80">
                    Detected Language: <b>{msg.languageName || msg.lang || "Unknown"}</b>

                  </div>
                )}

                {/* Toggle translation button */}
                {msg.who === "bot" && msg.originalEnglish && (
                  <button
                    className="text-xs mt-1 underline opacity-80 hover:opacity-100"
                    onClick={() => toggleTranslation(i)}
                  >
                    {msg.showTranslated ? "Hide English Translation" : "Show English Translation"}
                  </button>
                )}

                {/* Translation text */}
                {msg.showTranslated && (
                  <div className="text-sm mt-1 italic opacity-90">
                    "{msg.originalEnglish}"
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="my-2 p-3 rounded-lg max-w-[60%] bg-gray-600 text-white mr-auto inline-flex items-center">
              <span className="mr-2">Bot is typing</span>
              <span className="inline-flex">
                <span className="w-2 h-2 rounded-full bg-white/90 animate-bounce mr-1" />
                <span className="w-2 h-2 rounded-full bg-white/70 animate-bounce delay-150 mr-1" />
                <span className="w-2 h-2 rounded-full bg-white/50 animate-bounce delay-300" />
              </span>
            </div>
          )}

          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-xl transition"
            >
              ↓
            </button>
          )}
        </div>

        {/* Input bar - made bigger */}
        <div className="flex mt-4 gap-2">
          <textarea
            rows={2}
            className="flex-1 p-3 text-lg bg-gray-800 border border-gray-600 rounded-lg text-white resize-none
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message…"
            disabled={isLoading}
          />

          <button
            onClick={sendMessage}
            className={`px-5 py-3 rounded-lg text-white font-medium flex items-center justify-center text-lg ${
              isLoading ? "bg-blue-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={isLoading}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useApi } from "@/hooks/useApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Zap, Lightbulb } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  method?: string;
  timestamp: Date;
}

interface ChatResponse {
  response: string;
  intent: string;
  method: string;
}

interface SuggestionsResponse {
  suggestions: string[];
}

const Chat = () => {
  const { skills } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const suggestionsApi = useApi<SuggestionsResponse>();

  useEffect(() => {
    suggestionsApi.request("/api/chat/suggestions").catch(() => {});

    setMessages([{
      id: "welcome",
      role: "assistant",
      content: `👋 Hi! I'm **SkillAlign AI Assistant**.

I can help you with:
- 🎯 **Skill Gap Analysis** — "What skills am I missing for Full Stack?"
- 🏆 **Best Roles** — "What are my best matching roles?"
- 📊 **Market Insights** — "What are the top skills in demand?"
- 💰 **Salary Info** — "What's the salary for Data Science?"
- 🎓 **Career Advice** — Ask me anything about your career!

${skills.length > 0
  ? `I can see you have **${skills.length} skills** loaded. Ask me anything!`
  : `⚠️ Upload your resume first for personalized advice!`
}`,
      timestamp: new Date(),
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000"}/api/chat/message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            skills,
            history,
          }),
        }
      );

      const data: ChatResponse = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        method: data.method,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "❌ Something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/## (.*?)(\n|$)/g, "<h3 class='font-bold text-base mt-2 mb-1'>$1</h3>")
      .replace(/\n/g, "<br/>");
  };

  // ✅ Updated: method badge logic for Gemini
  const getMethodBadge = (method: string) => {
    if (method === "gemini_ai") {
      return {
        className: "border-blue-300 text-blue-600",
        label: "Gemini AI"
      };
    }
    return {
      className: "border-green-300 text-green-600",
      label: "Instant"
    };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="h-8 w-8 text-primary" />
          AI Chat Assistant
        </h1>
        <p className="text-muted-foreground mt-1">
          Ask anything about your skills, roles, and career
        </p>
        {skills.length > 0 && (
          <Badge variant="outline" className="mt-2">
            🧠 {skills.length} skills loaded
          </Badge>
        )}
      </div>

      {/* Messages */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted rounded-tl-sm"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(msg.content),
                    }}
                  />
                ) : (
                  <p>{msg.content}</p>
                )}

                {/* ✅ Updated method badge */}
                {msg.method && (
                  <div className="mt-2">
                    {(() => {
                      const badge = getMethodBadge(msg.method);
                      return (
                        <Badge
                          variant="outline"
                          className={`text-xs ${badge.className}`}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          {badge.label}
                        </Badge>
                      );
                    })()}
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Loading */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce"
                    style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce"
                    style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce"
                    style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Suggestions */}
        {messages.length <= 1 && suggestionsApi.data && (
          <div className="px-4 pb-2">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Lightbulb className="h-3 w-3" /> Suggested questions:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestionsApi.data.suggestions.slice(0, 4).map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/5 transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about your skills, roles, or career..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            ⚡ Simple questions are instant • 🤖 Complex questions use Gemini AI
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Chat;

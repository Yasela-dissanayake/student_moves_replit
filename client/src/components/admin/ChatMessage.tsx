import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistance } from "date-fns";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { Loader } from "@/components/ui/loader";

export interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
  onImplementCode?: (code: string, language: string) => void;
  isLoading?: boolean;
}

export function ChatMessage({
  role,
  content,
  createdAt,
  onImplementCode,
  isLoading = false,
}: ChatMessageProps) {
  const formatTime = (date?: Date) => {
    if (!date) return "";
    return formatDistance(date, new Date(), { addSuffix: true });
  };

  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex items-start gap-3 relative",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="w-8 h-8">
        <AvatarFallback>{isUser ? "U" : "AI"}</AvatarFallback>
        <AvatarImage
          src={isUser ? "/assets/user-avatar.png" : "/assets/ai-avatar.png"}
          alt={isUser ? "User" : "AI Assistant"}
        />
      </Avatar>

      <div
        className={cn(
          "flex flex-col max-w-[85%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground">
            {isUser ? "You" : "UniRent WebCraft"}
          </span>
          {createdAt && (
            <span className="text-xs text-muted-foreground">
              {formatTime(createdAt)}
            </span>
          )}
        </div>

        <div
          className={cn(
            "rounded-lg p-4",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-card-foreground"
          )}
        >
          {isLoading ? (
            <Loader size="sm" />
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    const language = match ? match[1] : "text";
                    const value = String(children).replace(/\n$/, "");

                    if (!inline && match) {
                      return (
                        <div className="relative group">
                          <SyntaxHighlighter
                            // style={oneDark}
                            language={language}
                            PreTag="div"
                            {...props}
                          >
                            {value}
                          </SyntaxHighlighter>
                          {onImplementCode && (
                            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                className="h-7 gap-1"
                                onClick={() => onImplementCode(value, language)}
                              >
                                <Play className="h-3.5 w-3.5" />
                                <span className="text-xs">Implement</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre({ children }: { children: any }) {
                    return <>{children}</>;
                  },
                  p({ children }: { children: any }) {
                    return <p className="mb-4 last:mb-0">{children}</p>;
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

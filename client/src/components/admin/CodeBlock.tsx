import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
  language: string;
  fileName?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language,
  fileName,
  className,
}: CodeBlockProps) {
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copied",
      description: "The code has been copied to your clipboard",
    });
  };

  return (
    <div className={cn("relative rounded-md overflow-hidden", className)}>
      {fileName && (
        <div className="bg-muted px-4 py-2 border-b text-xs font-mono flex items-center justify-between">
          <span className="text-muted-foreground">{fileName}</span>
          <span className="text-xs text-muted-foreground bg-muted-foreground/20 px-2 py-0.5 rounded">
            {language}
          </span>
        </div>
      )}
      <div className="relative">
        <SyntaxHighlighter
          language={language}
          // style={oneDark}
          customStyle={{
            margin: 0,
            borderRadius: fileName ? "0" : "0.375rem",
            fontSize: "0.875rem",
            lineHeight: 1.6,
          }}
          showLineNumbers
        >
          {code}
        </SyntaxHighlighter>
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-2 right-2 h-7 opacity-50 hover:opacity-100"
          onClick={handleCopyCode}
        >
          <Copy className="h-4 w-4" />
          <span className="sr-only">Copy code</span>
        </Button>
      </div>
    </div>
  );
}

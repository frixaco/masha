import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Sun, Moon, Home } from "lucide-react";
import parse from "html-react-parser";
import { Button } from "@/components/ui/button";
import { getFileContentFn } from "@/server/functions";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/c/$collectionId/$")({
  loader: async ({ params }) => {
    const fileName = decodeURIComponent(params._splat || "");
    if (!fileName) {
      throw new Error("File not found");
    }

    const result = await getFileContentFn({
      data: {
        collectionId: params.collectionId,
        fileName,
      },
    });

    if (!result) {
      throw new Error("File not found");
    }

    return result;
  },
  component: FileViewPage,
  errorComponent: FileError,
});

function FileError() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-2 bg-background">
      <div className="text-sm text-destructive">File not found</div>
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back
      </Link>
    </div>
  );
}

function FileViewPage() {
  const { id: collectionId, fileName, html } = Route.useLoaderData();
  const { theme, setTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-background">
      <header className="w-full max-w-xl flex items-center justify-between border-b border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="ghost" size="icon-sm">
              <Home />
            </Button>
          </Link>
          <Link
            to="/c/$collectionId"
            params={{ collectionId }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {collectionId}
          </Link>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={copyLink}>
            <Copy /> {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>

      <main className="w-full max-w-xl flex flex-col gap-4 px-4 py-6">
        <h1 className="text-base font-medium text-foreground">{fileName}</h1>
        <article className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
          {parse(html)}
        </article>
      </main>
    </div>
  );
}

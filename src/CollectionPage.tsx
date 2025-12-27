import { useEffect, useState } from "react";
import { Streamdown } from "streamdown";

interface CollectionPageProps {
  collectionId: string;
  selectedFile?: string;
}

export function CollectionPage({
  collectionId,
  selectedFile,
}: CollectionPageProps) {
  const [files, setFiles] = useState<string[]>([]);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/collection/${collectionId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Collection not found");
        return res.json();
      })
      .then((data) => {
        setFiles(data.files);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [collectionId]);

  useEffect(() => {
    if (!selectedFile) {
      setContent(null);
      return;
    }
    setLoading(true);
    fetch(`/api/collection/${collectionId}/${encodeURIComponent(selectedFile)}`)
      .then((res) => {
        if (!res.ok) throw new Error("File not found");
        return res.json();
      })
      .then((data) => {
        setContent(data.content);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [collectionId, selectedFile]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading && files.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-stone-400">Loading...</div>
      </div>
    );
  }

  if (error && files.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-stone-50">
        <div className="text-red-600">Error: {error}</div>
        <a
          href="#/"
          className="text-stone-500 hover:text-stone-900 transition-colors"
        >
          ← Upload new files
        </a>
      </div>
    );
  }

  if (selectedFile && content !== null) {
    return (
      <div className="min-h-screen bg-stone-50">
        <header className="border-b border-stone-200 bg-white">
          <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
            <a
              href={`#/c/${collectionId}`}
              className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              ← Back to collection
            </a>
            <button
              onClick={copyLink}
              className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-12">
          <h1 className="text-xl font-semibold text-stone-900 mb-8">
            {selectedFile}
          </h1>
          <article className="prose prose-stone prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-stone-900 prose-a:underline-offset-2 max-w-none">
            <Streamdown>{content}</Streamdown>
          </article>
        </main>

        <footer className="border-t border-stone-200 bg-white mt-16">
          <div className="max-w-2xl mx-auto px-6 py-6">
            <a
              href={`#/c/${collectionId}`}
              className="text-sm text-stone-400 hover:text-stone-900 transition-colors"
            >
              ← Back to collection
            </a>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900 tracking-tight font-mono">
                {collectionId}
              </h1>
              <p className="mt-2 text-stone-500 text-sm">
                Shared Collection
              </p>
            </div>
            <button
              onClick={copyLink}
              className="px-4 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <nav>
          <ul className="divide-y divide-stone-200 bg-white rounded-lg border border-stone-200">
            {files.map((file) => (
              <li key={file}>
                <a
                  href={`#/c/${collectionId}/${encodeURIComponent(file)}`}
                  className="flex items-center justify-between px-4 py-4 group hover:bg-stone-50 transition-colors"
                >
                  <span className="text-stone-900 group-hover:text-stone-600 transition-colors">
                    {file}
                  </span>
                  <span className="text-stone-400 group-hover:text-stone-600 transition-colors">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-8 text-center">
          <a
            href="#/"
            className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            Upload your own files →
          </a>
        </div>
      </main>
    </div>
  );
}

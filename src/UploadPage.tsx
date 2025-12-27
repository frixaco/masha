import { useState, useCallback } from "react";

export function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    const mdFiles = Array.from(newFiles).filter(
      (f) => f.name.endsWith(".md") || f.name.endsWith(".markdown")
    );
    setFiles((prev) => [...prev, ...mdFiles]);
    setError(null);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    if (name.trim()) {
      formData.append("name", name.trim());
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      window.location.hash = `/c/${data.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
            Markdown Viewer
          </h1>
          <p className="mt-2 text-stone-500">
            Upload markdown files and share them with a link
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragOver
              ? "border-stone-400 bg-stone-100"
              : "border-stone-300 bg-white"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <input
            type="file"
            id="file-input"
            className="hidden"
            multiple
            accept=".md,.markdown"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <label
            htmlFor="file-input"
            className="cursor-pointer text-stone-600 hover:text-stone-900"
          >
            <div className="text-4xl mb-4">📄</div>
            <div className="font-medium">Drop markdown files here</div>
            <div className="text-sm text-stone-400 mt-1">
              or click to browse
            </div>
          </label>
        </div>

        {files.length > 0 && (
          <div className="mt-6">
            <div className="mb-4">
              <label
                htmlFor="collection-name"
                className="block text-sm font-medium text-stone-700 mb-2"
              >
                Collection name (optional)
              </label>
              <input
                type="text"
                id="collection-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-notes"
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-stone-400">
                Letters, numbers, hyphens, and underscores only. Leave blank for
                auto-generated ID.
              </p>
            </div>

            <h2 className="text-sm font-medium text-stone-700 mb-3">
              Files to upload ({files.length})
            </h2>
            <ul className="divide-y divide-stone-200 bg-white rounded-lg border border-stone-200">
              {files.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="text-stone-900 truncate">{file.name}</span>
                  <button
                    onClick={() => removeFile(i)}
                    className="text-stone-400 hover:text-red-600 transition-colors"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-4 w-full bg-stone-900 text-white py-3 rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Upload & Get Share Link"}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}

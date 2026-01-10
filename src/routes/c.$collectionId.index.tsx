import { useCallback, useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { Copy, Github, Home, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addFilesToCollectionFn, getCollectionFn } from '@/server/functions'
import { useTheme } from '@/lib/theme'

export const Route = createFileRoute('/c/$collectionId/')({
  loader: async ({ params }) => {
    const collection = await getCollectionFn({ data: params.collectionId })
    if (!collection) {
      throw new Error('Collection not found')
    }
    return collection
  },
  component: CollectionPage,
  errorComponent: CollectionError,
})

function CollectionError() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 bg-background">
      <div className="text-sm text-destructive">Collection not found</div>
      <Link
        to="/"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back
      </Link>
    </div>
  )
}

function CollectionPage() {
  const { id: collectionId, files } = Route.useLoaderData()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<Array<File>>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return
    const mdFiles = Array.from(newFiles).filter(
      (f) => f.name.endsWith('.md') || f.name.endsWith('.markdown'),
    )
    setPendingFiles((prev) => [...prev, ...mdFiles])
    setError(null)
  }, [])

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const fileData = await Promise.all(
        pendingFiles.map(async (f) => ({
          name: f.name,
          content: await f.text(),
        })),
      )

      await addFilesToCollectionFn({
        data: { collectionId, files: fileData },
      })

      setPendingFiles([])
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center bg-background">
      <header className="w-full max-w-xl flex items-center justify-between border-b border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="ghost" size="icon-sm">
              <Home />
            </Button>
          </Link>
          <a
            href="https://github.com/frixaco/mash"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="icon-sm">
              <Github />
            </Button>
          </a>
          <h1 className="text-sm font-mono text-foreground">{collectionId}</h1>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={copyLink}>
            <Copy /> {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>

      <main className="w-full max-w-xl flex flex-col gap-4 px-4 py-4">
        <label
          htmlFor="file-input"
          className={`block border border-dashed p-4 text-center transition-colors cursor-pointer text-muted-foreground hover:text-foreground text-sm ${
            dragOver ? 'border-foreground' : 'border-border'
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFiles(e.dataTransfer.files)
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
          Drop .md files or click to browse
        </label>

        {pendingFiles.length > 0 && (
          <div className="flex flex-col gap-2">
            <ul className="divide-y divide-border border border-border text-sm">
              {pendingFiles.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <span className="text-foreground truncate">{file.name}</span>
                  <button
                    onClick={() => removeFile(i)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <Button size="xs" onClick={handleUpload} disabled={uploading}>
              {uploading ? '...' : 'Upload'}
            </Button>
          </div>
        )}

        {error && (
          <div className="p-3 text-sm border border-destructive/30 text-destructive">
            {error}
          </div>
        )}

        <ul className="w-full divide-y divide-border border border-border text-sm">
          {files.map((file) => (
            <li key={file}>
              <Link
                to="/c/$collectionId/$"
                params={{ collectionId, _splat: file }}
                className="flex items-center justify-between px-3 py-2 hover:bg-muted/50"
              >
                <span className="text-foreground">{file}</span>
                <span className="text-muted-foreground">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}

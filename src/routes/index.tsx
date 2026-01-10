import { useCallback, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadFilesFn } from '@/server/functions'
import { useTheme } from '@/lib/theme'

export const Route = createFileRoute('/')({
  component: UploadPage,
})

function UploadPage() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [files, setFiles] = useState<Array<File>>([])
  const [name, setName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const focusNameInput = () => {
    setTimeout(() => nameInputRef.current?.focus(), 0)
  }

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return
    const mdFiles = Array.from(newFiles).filter(
      (f) => f.name.endsWith('.md') || f.name.endsWith('.markdown'),
    )
    if (mdFiles.length === 0) return
    setFiles((prev) => [...prev, ...mdFiles])
    setError(null)
    focusNameInput()
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text/plain')
    if (!text.trim()) return

    // Extract the first # heading for the filename
    const headingMatch = text.match(/^#\s+(.+)$/m)
    let fileName = 'pasted.md'
    if (headingMatch) {
      fileName =
        headingMatch[1]
          .trim()
          .replace(/[<>:"/\\|?*]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50) + '.md'
    }

    const file = new File([text], fileName, { type: 'text/markdown' })
    setFiles((prev) => [...prev, file])
    setError(null)
    focusNameInput()
  }, [])

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const fileData = await Promise.all(
        files.map(async (f) => ({
          name: f.name,
          content: await f.text(),
        })),
      )

      const result = await uploadFilesFn({
        data: {
          files: fileData,
          name: name.trim() || undefined,
        },
      })

      navigate({ to: '/c/$collectionId', params: { collectionId: result.id } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploading(false)
    }
  }

  return (
    <div
      className="flex flex-col items-center bg-background outline-none"
      tabIndex={-1}
      autoFocus
      onPaste={handlePaste}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && files.length > 0 && !uploading) {
          handleUpload()
        }
      }}
    >
      <header className="w-full max-w-xl flex items-center justify-between border-b border-border px-4 py-4">
        <h1 className="text-sm font-medium text-foreground">mash</h1>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>
      </header>

      <main className="w-full max-w-xl flex flex-col gap-4 px-4 py-6">
        <label
          htmlFor="file-input"
          className={`block border border-dashed p-6 text-center transition-colors cursor-pointer text-muted-foreground hover:text-foreground text-sm ${
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
          Drop .md files, click to browse, or paste markdown
        </label>

        {files.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Collection name (optional)"
                className="text-sm"
              />
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? '...' : 'Upload'}
              </Button>
            </div>

            <ul className="divide-y divide-border border border-border text-sm">
              {files.map((file, i) => (
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
          </div>
        )}

        {error && (
          <div className="p-3 text-sm border border-destructive/30 text-destructive">
            {error}
          </div>
        )}
      </main>
    </div>
  )
}

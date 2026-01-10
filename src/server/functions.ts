import { createServerFn } from '@tanstack/react-start'
import { nanoid } from 'nanoid'
import {
  deleteCollection,
  getFileContent,
  isStorageConfigured,
  listCollectionFiles,
  uploadFile,
} from './storage'
import { renderMarkdown } from '@/lib/markdown'

export const uploadFilesFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      files: Array<{ name: string; content: string }>
      name?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    if (!isStorageConfigured()) {
      throw new Error('Storage not configured')
    }

    const { files, name } = data

    if (files.length === 0) {
      throw new Error('No files provided')
    }

    const invalidFiles = files.filter(
      (f) => !f.name.endsWith('.md') && !f.name.endsWith('.markdown'),
    )
    if (invalidFiles.length > 0) {
      throw new Error('Only markdown files are allowed')
    }

    let collectionId: string

    if (name) {
      if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        throw new Error(
          'Name can only contain letters, numbers, hyphens, and underscores',
        )
      }
      if (name.length > 50) {
        throw new Error('Name must be 50 characters or less')
      }
      const existing = await listCollectionFiles(name)
      if (existing.length > 0) {
        throw new Error('A collection with this name already exists')
      }
      collectionId = name
    } else {
      collectionId = nanoid(10)
    }

    for (const file of files) {
      await uploadFile(collectionId, file.name, file.content)
    }

    return {
      id: collectionId,
      files: files.map((f) => f.name),
    }
  })

export const addFilesToCollectionFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      collectionId: string
      files: Array<{ name: string; content: string }>
    }) => data,
  )
  .handler(async ({ data }) => {
    if (!isStorageConfigured()) {
      throw new Error('Storage not configured')
    }

    const { collectionId, files } = data

    if (files.length === 0) {
      throw new Error('No files provided')
    }

    const invalidFiles = files.filter(
      (f) => !f.name.endsWith('.md') && !f.name.endsWith('.markdown'),
    )
    if (invalidFiles.length > 0) {
      throw new Error('Only markdown files are allowed')
    }

    const existing = await listCollectionFiles(collectionId)
    if (existing.length === 0) {
      throw new Error('Collection not found')
    }

    for (const file of files) {
      await uploadFile(collectionId, file.name, file.content)
    }

    const updatedFiles = await listCollectionFiles(collectionId)

    return {
      id: collectionId,
      files: updatedFiles,
    }
  })

export const getCollectionFn = createServerFn({ method: 'GET' })
  .inputValidator((collectionId: string) => collectionId)
  .handler(async ({ data: collectionId }) => {
    if (!isStorageConfigured()) {
      throw new Error('Storage not configured')
    }

    const files = await listCollectionFiles(collectionId)

    if (files.length === 0) {
      return null
    }

    return { id: collectionId, files }
  })

export const getFileContentFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { collectionId: string; fileName: string }) => data)
  .handler(async ({ data }) => {
    if (!isStorageConfigured()) {
      throw new Error('Storage not configured')
    }

    const content = await getFileContent(data.collectionId, data.fileName)

    if (!content) {
      return null
    }

    const html = await renderMarkdown(content)

    return {
      id: data.collectionId,
      fileName: data.fileName,
      html,
    }
  })

export const deleteCollectionFn = createServerFn({ method: 'POST' })
  .inputValidator((collectionId: string) => collectionId)
  .handler(async ({ data: collectionId }) => {
    if (!isStorageConfigured()) {
      throw new Error('Storage not configured')
    }

    const deleted = await deleteCollection(collectionId)

    if (!deleted) {
      throw new Error('Collection not found')
    }

    return { success: true }
  })

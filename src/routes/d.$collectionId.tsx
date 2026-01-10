import { createFileRoute, redirect } from '@tanstack/react-router'
import { deleteCollectionFn } from '@/server/functions'

export const Route = createFileRoute('/d/$collectionId')({
  loader: async ({ params }) => {
    await deleteCollectionFn({ data: params.collectionId })
    throw redirect({ to: '/' })
  },
})

import { serve } from "bun";
import index from "./index.html";
import { nanoid } from "nanoid";
import {
  isStorageConfigured,
  uploadFile,
  listCollectionFiles,
  listAllCollections,
  getFileContent,
  deleteCollection,
} from "./storage";

const API_KEY = process.env.API_KEY;

function isAuthorized(req: Request): boolean {
  if (!API_KEY) return false;
  const auth = req.headers.get("Authorization");
  return auth === `Bearer ${API_KEY}`;
}

const unauthorized = () =>
  Response.json({ error: "Unauthorized" }, { status: 401 });

const server = serve({
  routes: {
    "/*": index,

    "/api/health": {
      GET() {
        return Response.json({
          ok: true,
          storageConfigured: isStorageConfigured(),
        });
      },
    },

    "/api/upload": {
      async POST(req) {
        if (!isAuthorized(req)) return unauthorized();
        if (!isStorageConfigured()) {
          return Response.json(
            { error: "Storage not configured" },
            { status: 503 }
          );
        }

        const formData = await req.formData();
        const files = formData.getAll("files") as File[];

        if (files.length === 0) {
          return Response.json({ error: "No files provided" }, { status: 400 });
        }

        const invalidFiles = files.filter(
          (f) => !f.name.endsWith(".md") && !f.name.endsWith(".markdown")
        );
        if (invalidFiles.length > 0) {
          return Response.json(
            { error: "Only markdown files are allowed" },
            { status: 400 }
          );
        }

        const customName = formData.get("name") as string | null;
        let collectionId: string;

        if (customName) {
          if (!/^[a-zA-Z0-9_-]+$/.test(customName)) {
            return Response.json(
              { error: "Name can only contain letters, numbers, hyphens, and underscores" },
              { status: 400 }
            );
          }
          if (customName.length > 50) {
            return Response.json(
              { error: "Name must be 50 characters or less" },
              { status: 400 }
            );
          }
          const existing = await listCollectionFiles(customName);
          if (existing.length > 0) {
            return Response.json(
              { error: "A collection with this name already exists" },
              { status: 409 }
            );
          }
          collectionId = customName;
        } else {
          collectionId = nanoid(10);
        }

        for (const file of files) {
          const content = await file.text();
          await uploadFile(collectionId, file.name, content);
        }

        return Response.json({
          id: collectionId,
          files: files.map((f) => f.name),
        });
      },
    },

    "/api/collections": {
      async GET(req) {
        if (!isAuthorized(req)) return unauthorized();
        if (!isStorageConfigured()) {
          return Response.json(
            { error: "Storage not configured" },
            { status: 503 }
          );
        }

        const collections = await listAllCollections();
        return Response.json({ collections });
      },
    },

    "/api/collection/:id": {
      async GET(req) {
        if (!isStorageConfigured()) {
          return Response.json(
            { error: "Storage not configured" },
            { status: 503 }
          );
        }

        const collectionId = req.params.id;
        const files = await listCollectionFiles(collectionId);

        if (files.length === 0) {
          return Response.json(
            { error: "Collection not found" },
            { status: 404 }
          );
        }

        return Response.json({ id: collectionId, files });
      },

      async DELETE(req) {
        if (!isAuthorized(req)) return unauthorized();
        if (!isStorageConfigured()) {
          return Response.json(
            { error: "Storage not configured" },
            { status: 503 }
          );
        }

        const collectionId = req.params.id;
        const deleted = await deleteCollection(collectionId);

        if (!deleted) {
          return Response.json(
            { error: "Collection not found" },
            { status: 404 }
          );
        }

        return Response.json({ deleted: true, id: collectionId });
      },
    },

    "/api/collection/:id/:file": async (req) => {
      if (!isStorageConfigured()) {
        return Response.json(
          { error: "Storage not configured" },
          { status: 503 }
        );
      }

      const collectionId = req.params.id;
      const fileName = decodeURIComponent(req.params.file);
      const content = await getFileContent(collectionId, fileName);

      if (!content) {
        return Response.json({ error: "File not found" }, { status: 404 });
      }

      return Response.json({ id: collectionId, fileName, content });
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);

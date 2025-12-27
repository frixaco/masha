import { useState, useEffect } from "react";
import { UploadPage } from "./UploadPage";
import { CollectionPage } from "./CollectionPage";
import "./index.css";

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return hash;
}

export function App() {
  const hash = useHashRoute();

  const collectionMatch = hash.match(/^#\/c\/([a-zA-Z0-9_-]+)$/);
  if (collectionMatch && collectionMatch[1]) {
    return <CollectionPage collectionId={collectionMatch[1]} />;
  }

  const fileMatch = hash.match(/^#\/c\/([a-zA-Z0-9_-]+)\/(.+)$/);
  if (fileMatch && fileMatch[1] && fileMatch[2]) {
    return (
      <CollectionPage
        collectionId={fileMatch[1]}
        selectedFile={decodeURIComponent(fileMatch[2])}
      />
    );
  }

  return <UploadPage />;
}

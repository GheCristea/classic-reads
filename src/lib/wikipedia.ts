// Minimal Wikipedia image helper to fetch an author's portrait thumbnail
type WikipediaResponse = {
    query?: {
        pages?: Record<string, {
            thumbnail?: {
                source?: string;
            };
            original?: {
                source?: string;
            };
            missing?: boolean;
        }>;
    };
};

export async function getAuthorPortraitUrl(
  authorName: string,
  width: number = 300
): Promise<string | null> {
  if (!authorName || !authorName.trim()) return null;

  // Build a title suitable for Wikipedia. Keep punctuation, just normalize spaces to underscores
  const title = authorName.trim().replace(/\s+/g, "_");

  const params = new URLSearchParams({
    action: "query",
    format: "json",
    redirects: "1",
    prop: "pageimages",
    piprop: "thumbnail|original",
    pithumbsize: String(width),
    titles: title,
  });

  const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`;

  try {
    const res = await fetch(url, {
      // Cache on the server for a day; portraits don't change often
      next: { revalidate: 86400 },
      // Explicitly disable caching on the client
      cache: "force-cache",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as WikipediaResponse;
    const pages = data?.query?.pages;
    if (!pages) return null;

    const firstPage = Object.values(pages)[0];
    if (!firstPage || firstPage.missing) return null;

    const thumb: string | undefined = firstPage.thumbnail?.source || firstPage.original?.source;
    return thumb || null;
  } catch {
    return null;
  }
}



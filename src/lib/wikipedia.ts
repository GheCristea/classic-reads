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


// Lightweight metadata fetch using Wikipedia + Wikidata
type WikipediaPagepropsResponse = {
  query?: {
    pages?: Record<string, {
      pageprops?: {
        wikibase_item?: string
      }
      missing?: boolean
    }>
  }
}

type WikidataEntitiesResponse = {
  entities?: Record<string, {
    labels?: Record<string, { value: string }>
    claims?: Record<string, Array<{
      mainsnak?: {
        datavalue?: {
          value?: {
            time?: string
            id?: string
          }
        }
      }
    }>>
  }>
}

export type AuthorMetadata = {
  birthYear: number | null
  deathYear: number | null
  nationality: string | null
}

function extractYearFromWikidataTime(time?: string): number | null {
  if (!time || typeof time !== "string") return null
  // Wikidata time format example: "+1879-03-14T00:00:00Z"
  const match = time.match(/^[+-]?(\d{1,4})/)
  if (!match) return null
  const year = parseInt(match[1], 10)
  return Number.isFinite(year) ? year : null
}

async function getWikidataIdForAuthor(authorName: string): Promise<string | null> {
  const title = authorName.trim().replace(/\s+/g, "_")
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    redirects: "1",
    prop: "pageprops",
    ppprop: "wikibase_item",
    titles: title,
    origin: "*",
  })
  const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`
  try {
    const res = await fetch(url, { next: { revalidate: 86400 }, cache: "force-cache" })
    if (!res.ok) return null
    const data = (await res.json()) as WikipediaPagepropsResponse
    const pages = data?.query?.pages
    if (!pages) return null
    const firstPage = Object.values(pages)[0]
    if (!firstPage || firstPage.missing) return null
    return firstPage.pageprops?.wikibase_item || null
  } catch {
    return null
  }
}

export async function getAuthorMetadata(authorName: string): Promise<AuthorMetadata> {
  const fallback: AuthorMetadata = { birthYear: null, deathYear: null, nationality: null }
  const wikidataId = await getWikidataIdForAuthor(authorName)
  if (!wikidataId) return fallback

  // Fetch entity with claims and labels (en)
  const params = new URLSearchParams({
    action: "wbgetentities",
    format: "json",
    ids: wikidataId,
    props: "claims|labels",
    languages: "en",
    origin: "*",
  })
  const url = `https://www.wikidata.org/w/api.php?${params.toString()}`

  try {
    const res = await fetch(url, { next: { revalidate: 86400 }, cache: "force-cache" })
    if (!res.ok) return fallback
    const data = (await res.json()) as WikidataEntitiesResponse
    const entity = data.entities?.[wikidataId]
    if (!entity) return fallback
    const claims = entity.claims || {}

    // P569: date of birth; P570: date of death; P27: country of citizenship
    const birthTime = claims.P569?.[0]?.mainsnak?.datavalue?.value?.time as string | undefined
    const deathTime = claims.P570?.[0]?.mainsnak?.datavalue?.value?.time as string | undefined
    const birthYear = extractYearFromWikidataTime(birthTime)
    const deathYear = extractYearFromWikidataTime(deathTime)

    const citizenshipEntityId = claims.P27?.[0]?.mainsnak?.datavalue?.value?.id as string | undefined
    let nationality: string | null = null
    if (citizenshipEntityId) {
      // fetch label for the citizenship entity
      const params2 = new URLSearchParams({
        action: "wbgetentities",
        format: "json",
        ids: citizenshipEntityId,
        props: "labels",
        languages: "en",
        origin: "*",
      })
      const url2 = `https://www.wikidata.org/w/api.php?${params2.toString()}`
      try {
        const res2 = await fetch(url2, { next: { revalidate: 86400 }, cache: "force-cache" })
        if (res2.ok) {
          const data2 = (await res2.json()) as WikidataEntitiesResponse
          const label = data2.entities?.[citizenshipEntityId]?.labels?.en?.value
          nationality = label || null
        }
      } catch {
        // ignore
      }
    }

    return { birthYear, deathYear, nationality }
  } catch {
    return fallback
  }
}



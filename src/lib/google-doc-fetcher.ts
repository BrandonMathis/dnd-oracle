// Google Doc content fetcher for public documents
// Uses Google Docs public export feature to get document content as plain text

export async function fetchGoogleDocContent(
  docId: string
): Promise<string | null> {
  try {
    // Use Google Docs export URL to get plain text content
    // This works for publicly accessible documents without authentication
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;

    console.log(`Fetching Google Doc content from: ${exportUrl}`);

    const response = await fetch(exportUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; The-Oracle-Bot/1.0)",
      },
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch document: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const content = await response.text();

    if (!content || content.trim().length === 0) {
      console.error("Document content is empty");
      return null;
    }

    console.log(
      `Successfully fetched ${content.length} characters from Google Doc`
    );
    return content.trim();
  } catch (error) {
    console.error("Error fetching Google Doc content:", error);
    return null;
  }
}

export function extractDocIdFromUrl(url: string): string | null {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

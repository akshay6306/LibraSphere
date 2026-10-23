/**
 * Builds a working Amazon product or search URL from ISBN and book details.
 * Prioritizes direct ISBN lookup on Amazon India, with international fallback.
 */
export function buildAmazonUrl(isbn: string, title?: string, author?: string): string {
  const cleanIsbn = (isbn || '').replace(/[^0-9X]/gi, '');
  if (cleanIsbn.length === 10 || cleanIsbn.length === 13) {
    return `https://www.amazon.in/s?k=${cleanIsbn}&i=stripbooks`;
  }
  const query = encodeURIComponent([title, author].filter(Boolean).join(' '));
  return `https://www.amazon.in/s?k=${query}&i=stripbooks`;
}

export function buildGooglePreviewUrl(isbn: string, existingPreviewUrl?: string | null): string {
  if (existingPreviewUrl && existingPreviewUrl.startsWith('http')) {
    return existingPreviewUrl;
  }
  const cleanIsbn = (isbn || '').replace(/[^0-9X]/gi, '');
  return `https://books.google.com/books?vid=ISBN${cleanIsbn}&printsec=frontcover`;
}

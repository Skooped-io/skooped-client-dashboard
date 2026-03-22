/**
 * Converts a string into a URL-safe slug.
 * Examples:
 *   'Anderson Roofing & Sons LLC' → 'anderson-roofing-sons-llc'
 *   "Jake's Lawn Care"           → 'jakes-lawn-care'
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric runs with a single hyphen
    .replace(/-+/g, "-")         // collapse multiple hyphens
    .replace(/^-+|-+$/g, "");    // trim leading/trailing hyphens
}

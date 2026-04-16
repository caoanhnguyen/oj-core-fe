/**
 * Generate a URL-friendly slug from a string.
 * Supports Vietnamese characters by removing accents and handling specific chars like 'đ'.
 *
 * @param {string} text - The input string to generate slug from
 * @returns {string} - The generated slug
 */
export const generateSlug = (text) => {
  if (!text) return ''
  
  return text
    .normalize('NFD') // Decompose combined characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D') // Replace Vietnamese 'đ'
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove invalid chars
    .replace(/[\s-]+/g, '-') // Collapse whitespace and hyphens
    .replace(/^-+|-+$/g, '') // Trim hyphens
}

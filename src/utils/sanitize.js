module.exports = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/<[^>]*>/g, '')        // strip HTML tags
    .replace(/&[^;]+;/g, ' ')       // strip HTML entities (&amp; &lt; etc)
    .replace(/[<>]/g, '')           // remove any remaining < >
    .trim();
};
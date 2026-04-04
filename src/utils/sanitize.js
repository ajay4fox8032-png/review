module.exports = (str) =>
  str ? String(str).replace(/<[^>]*>/g, '').trim() : '';

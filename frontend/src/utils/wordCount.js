export const countWords = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export const truncateText = (text, maxWords = 30) => {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
};

export const isValidDescription = (text) => {
  return countWords(text) <= 2000;
};


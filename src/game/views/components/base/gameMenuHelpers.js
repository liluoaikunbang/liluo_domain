export const formatResourceText = (label, amount) => `${label}：${amount}`;

export function resolvePlaceholderDetailParagraphs(slot, fallbackParagraphs) {
  if (!slot) {
    return [];
  }

  if (Array.isArray(slot.descriptionParagraphs) && slot.descriptionParagraphs.length > 0) {
    return slot.descriptionParagraphs;
  }

  return fallbackParagraphs;
}

export function shouldOpenMetaPopoverRight(flagRect, boundaryRect, popoverWidth) {
  const width = Math.max(0, Number(popoverWidth) || 0);
  const availableLeft = Math.max(0, flagRect.right - boundaryRect.left);
  const availableRight = Math.max(0, boundaryRect.right - flagRect.left);

  if (availableLeft >= width) {
    return false;
  }

  return availableRight > availableLeft;
}

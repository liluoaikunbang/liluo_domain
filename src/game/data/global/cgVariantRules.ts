export interface CgVariantPresentation {
  key: string;
  image?: string;
  displayMode?: 'single' | 'layer';
  isDefault?: boolean;
}

const cgLayerVariantNames = new Set([
  '病房约束（束手套）',
  '病房约束（束脚套）',
  '超市购物（洞洞鞋）',
  '超市购物（拖鞋）'
]);

export function resolveCgVariantDisplayMode(baseName: string): 'single' | 'layer' {
  return cgLayerVariantNames.has(baseName) ? 'layer' : 'single';
}

export function resolveCgBaseVariant<T extends CgVariantPresentation>(
  variants: readonly T[],
  activeVariantIndex: number
): T | null {
  const activeVariant = variants[activeVariantIndex];

  if (activeVariant?.displayMode !== 'layer') {
    return activeVariant ?? null;
  }

  return variants.find((variant) => variant.isDefault && variant.displayMode !== 'layer')
    ?? variants.find((variant) => variant.displayMode !== 'layer')
    ?? null;
}

export function resolveCgSelectableVariants<T extends CgVariantPresentation>(
  variants: readonly T[],
  _activeVariantIndex: number
): T[] {
  return [...variants];
}

export function resolveCgVariantColumns<T extends CgVariantPresentation>(
  variants: readonly T[]
): { baseVariants: T[]; layerVariants: T[] } {
  return {
    baseVariants: variants.filter((variant) => variant.displayMode !== 'layer'),
    layerVariants: variants.filter((variant) => variant.displayMode === 'layer')
  };
}

export function resolveCgPreviewImages(
  variants: readonly CgVariantPresentation[],
  activeVariantIndex: number,
  selectedLayerKeys: ReadonlySet<string>
): string[] {
  const baseVariant = resolveCgBaseVariant(variants, activeVariantIndex);
  const layerImages = variants
    .filter((variant) => (
      variant.displayMode === 'layer'
      && selectedLayerKeys.has(variant.key)
      && variant.image
    ))
    .map((variant) => variant.image as string);

  return baseVariant?.image ? [baseVariant.image, ...layerImages] : layerImages;
}

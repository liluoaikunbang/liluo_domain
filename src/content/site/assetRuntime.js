const localAssets = import.meta.glob('../../../docs/assets/readme/**/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  import: 'default',
})

function localKey(sourcePath) {
  return `../../../${sourcePath.replaceAll('\\', '/')}`
}

export function resolveSiteAsset(asset, variant = 'content') {
  if (!asset) return ''
  const remote = asset.urls?.[variant] || asset.urls?.content || asset.urls?.card || asset.urls?.large || asset.urls?.thumb
  if (remote) return remote
  return localAssets[localKey(asset.sourcePath)] || ''
}

export function resolveSiteSrcset(asset) {
  if (!asset?.urls) return ''
  return [
    asset.urls.thumb ? `${asset.urls.thumb} 640w` : '',
    asset.urls.card ? `${asset.urls.card} 1600w` : '',
    asset.urls.large ? `${asset.urls.large} ${asset.width || 2200}w` : '',
  ]
    .filter(Boolean)
    .join(', ')
}

const localAssets = import.meta.glob(
  [
    '../../../docs/assets/readme/generated/hero-liluo-universe-v3.jpg',
    '../../../docs/assets/readme/generated/six-domains-panorama-v2.png',
    '../../../docs/assets/readme/generated/liluo-master-character-portrait-v2.png',
    '../../../docs/assets/readme/generated/liluo-identity-and-state-base.png',
    '../../../docs/assets/readme/generated/one-story-many-forms-v2-base.png',
    '../../../docs/assets/readme/generated/readme-evidence-boundary-base-v2.png',
    '../../../docs/assets/readme/generated/ai-participation-boundary-base.png',
    '../../../docs/assets/readme/generated/five-layer-production-system-base.png',
    '../../../docs/assets/readme/generated/production-maturity-ladder-base.png',
    '../../../docs/assets/readme/generated/project-roadmap-base.png',
    '../../../docs/assets/readme/generated/collaboration-role-star-map-base.png',
    '../../../docs/assets/readme/generated/closing-invitation-banner.png',
    '../../../docs/assets/readme/generated/project-scale-dashboard-base.png',
    '../../../docs/assets/readme/generated/universe-state-event-network-base.png',
    '../../../docs/assets/readme/generated/relationship-graph-display-base.png',
    '../../../docs/assets/readme/generated/story-production-pipeline-base-v2.png',
    '../../../docs/assets/readme/generated/story-to-playable-case-base.png',
    '../../../docs/assets/readme/composites/runtime-evidence-board-v1.png',
    '../../../docs/assets/readme/composites/story-production-pipeline-board-v2.png',
    '../../../docs/assets/readme/composites/relationship-graph-real-evidence-board.png',
    '../../../docs/assets/readme/composites/project-scale-dashboard-v2.png',
    '../../../docs/assets/readme/composites/readme-evidence-boundary-board-v2.png',
    '../../../docs/assets/readme/composites/story-to-playable-case-asylum-board.png',
    '../../../docs/assets/readme/composites/world-munika-triptych-board.png',
    '../../../docs/assets/readme/generated/world-munika-poster-v2.png',
    '../../../docs/assets/readme/generated/world-munika-scene-v2.png',
    '../../../docs/assets/readme/generated/world-munika-event-v2.png',
    '../../../docs/assets/readme/composites/world-fuguang-triptych-board.png',
    '../../../docs/assets/readme/generated/world-fuguang-poster-v2.png',
    '../../../docs/assets/readme/generated/world-fuguang-scene-v2.png',
    '../../../docs/assets/readme/generated/world-fuguang-event-v2.png',
    '../../../docs/assets/readme/generated/world-fuguang-*-zone-v1.png',
    '../../../docs/assets/readme/composites/world-jitu-triptych-board.png',
    '../../../docs/assets/readme/generated/world-jitu-poster-v2.png',
    '../../../docs/assets/readme/generated/world-jitu-scene-v2.png',
    '../../../docs/assets/readme/generated/world-jitu-event-v2.png',
    '../../../docs/assets/readme/composites/world-chenhuan-triptych-board.png',
    '../../../docs/assets/readme/generated/world-chenhuan-poster-v2.png',
    '../../../docs/assets/readme/generated/world-chenhuan-scene-v2.png',
    '../../../docs/assets/readme/generated/world-chenhuan-event-v2.png',
    '../../../docs/assets/readme/composites/world-zhoufu-triptych-board.png',
    '../../../docs/assets/readme/generated/world-zhoufu-poster-v2.png',
    '../../../docs/assets/readme/generated/world-zhoufu-scene-v2.png',
    '../../../docs/assets/readme/generated/world-zhoufu-event-v2.png',
    '../../../docs/assets/readme/composites/world-xingyu-triptych-board.png',
    '../../../docs/assets/readme/generated/world-xingyu-poster-v2.png',
    '../../../docs/assets/readme/generated/world-xingyu-scene-v2.png',
    '../../../docs/assets/readme/generated/world-xingyu-event-v2.png',
    '../../../docs/assets/readme/generated/liluo-munika-variant.png',
    '../../../docs/assets/readme/generated/liluo-fuguang-variant.png',
    '../../../docs/assets/readme/generated/liluo-jitu-variant.png',
    '../../../docs/assets/readme/generated/liluo-chenhuan-variant.png',
    '../../../docs/assets/readme/generated/liluo-zhoufu-variant.png',
    '../../../docs/assets/readme/generated/liluo-xingyu-variant.png',
    '../../../docs/assets/readme/prototype-campus-map.png',
    '../../../docs/assets/readme/prototype-gallery-ui.png',
    '../../../docs/assets/readme/screenshots/README-SHOT-03-dialogue-and-map-event.png',
    '../../../docs/assets/readme/screenshots/README-SHOT-04-save-load-panel.png',
    '../../../docs/assets/readme/screenshots/README-SHOT-05-relation-graph-panel.png',
    '../../../docs/assets/readme/screenshots/README-SHOT-06-interactive-fiction-mode.png',
    '../../../docs/assets/readme/screenshots/README-SHOT-07-restraint-state-combinations.png',
  ],
  {
    eager: true,
    import: 'default',
  },
)

function localKey(objectKey) {
  return `../../../${objectKey}`
}

export function resolveSiteAsset(asset, variant = 'content') {
  if (!asset) return ''
  const remote = asset.urls?.[variant] || asset.urls?.content || asset.urls?.card || asset.urls?.large
  if (remote) return remote
  return localAssets[localKey(asset.objectKey)] || ''
}

export function resolveSiteSrcset(asset) {
  if (!asset?.urls) return ''
  return [
    asset.urls.thumb ? `${asset.urls.thumb} 640w` : '',
    asset.urls.card ? `${asset.urls.card} 1600w` : '',
    asset.urls.large ? `${asset.urls.large} ${asset.width || 2400}w` : '',
  ]
    .filter(Boolean)
    .join(', ')
}

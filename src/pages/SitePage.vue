<template>
  <SiteShell>
    <section v-if="pageKind === 'home'" class="site-hero">
      <ResponsiveImage class="site-hero__media" :asset="asset('hero')" priority :framed="false" sizes="100vw" />
      <div class="site-hero__shade" aria-hidden="true"></div>
      <div class="site-container site-hero__content">
        <p class="site-kicker">{{ siteConfig.subtitle }}</p>
        <h1>璃落宇宙</h1>
        <p>同一宇宙里的世界、角色、关系、状态和氛围，会被持续生产成可读、可玩、可验证的正式体验。当前旗舰入口仍是像素风冒险 RPG。</p>
        <div class="site-actions">
          <RouterLink class="site-button site-button--primary" to="/worlds">探索六界</RouterLink>
          <RouterLink class="site-button" to="/evidence">查看真实证据</RouterLink>
          <RouterLink class="site-button" to="/game">进入游戏</RouterLink>
        </div>
      </div>
    </section>

    <template v-if="pageKind === 'home'">
      <section class="site-section site-container">
        <SectionHeader kicker="真实存在证明" title="先看证据，再谈愿景。" body="以下数字来自仓库清单、脚本统计或已归档截图；它们说明项目真实存在，但不夸大为全部世界都已可玩。" />
        <div class="stat-strip">
          <article v-for="stat in siteStats" :key="stat.label">
            <strong>{{ stat.value }}</strong>
            <span>{{ stat.label }}</span>
            <small>{{ stat.note }}</small>
          </article>
        </div>
      </section>

      <WorldsBlock />
      <CharacterBlock />
      <ExperienceBlock />
      <EvidenceBlock compact />
      <GalleryBlock compact />
      <ProductionBlock compact />
      <RoadmapBlock compact />

      <section class="site-section site-container site-closing">
        <h2>从世界入口继续走。</h2>
        <div class="site-actions">
          <RouterLink class="site-button site-button--primary" to="/game">进入游戏</RouterLink>
          <RouterLink class="site-button" to="/worlds">浏览六界</RouterLink>
          <RouterLink class="site-button" to="/collab">参与协作</RouterLink>
        </div>
      </section>
    </template>

    <WorldsPage v-else-if="pageKind === 'worlds'" />
    <WorldDetailPage v-else-if="pageKind === 'world-detail'" :world-id="route.params.worldId" />
    <SeriesPage v-else-if="pageKind === 'series'" :world-id="route.params.worldId" :series-id="route.params.seriesId" />
    <CharactersPage v-else-if="pageKind === 'characters'" />
    <CharacterDetailPage v-else-if="pageKind === 'character-detail'" :character-id="route.params.characterId" />
    <GalleryPage v-else-if="pageKind === 'gallery'" />
    <EvidencePage v-else-if="pageKind === 'evidence'" />
    <ProductionPage v-else-if="pageKind === 'production'" />
    <RoadmapPage v-else-if="pageKind === 'roadmap'" />
    <DevlogPage v-else-if="pageKind === 'devlog'" />
    <CollabPage v-else-if="pageKind === 'collab'" />
  </SiteShell>
</template>

<script setup>
import { computed, defineComponent, ref, h, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import SiteShell from '../components/site/SiteShell.vue'
import ResponsiveImage from '../components/site/ResponsiveImage.vue'
import StatusBadge from '../components/site/StatusBadge.vue'
import {
  assets,
  characters,
  collaborationNeeds,
  devlogEntries,
  evidenceItems,
  evidenceLevels,
  footerNavigation,
  getAsset,
  getCharacter,
  getSeries,
  getWorld,
  productionSteps,
  roadmapItems,
  series,
  siteConfig,
  siteStats,
  visualPlanBatches,
  worlds,
} from '../content/site/siteData'

const route = useRoute()

const pageKind = computed(() => {
  if (route.name === 'site-world-detail') return 'world-detail'
  if (route.name === 'site-series') return 'series'
  if (route.name === 'site-character-detail') return 'character-detail'
  return String(route.name || 'site-home').replace('site-', '')
})

watchEffect(() => {
  const titles = {
    home: '璃落宇宙 / Liluo Universe',
    worlds: '世界门户 / 璃落宇宙',
    gallery: '视觉图鉴 / 璃落宇宙',
    evidence: '真实证据 / 璃落宇宙',
    production: '生产体系 / 璃落宇宙',
    roadmap: '路线图 / 璃落宇宙',
    devlog: '开发日志 / 璃落宇宙',
    collab: '协作参与 / 璃落宇宙',
    characters: '角色档案 / 璃落宇宙',
  }
  document.title = titles[pageKind.value] || '璃落宇宙'
})

function asset(assetId) {
  return getAsset(assetId)
}

const SectionHeader = defineComponent({
  props: {
    kicker: { type: String, default: '' },
    title: { type: String, required: true },
    body: { type: String, default: '' },
  },
  setup(props) {
    return () =>
      h('div', { class: 'section-header' }, [
        props.kicker ? h('p', { class: 'site-kicker' }, props.kicker) : null,
        h('h2', props.title),
        props.body ? h('p', props.body) : null,
      ])
  },
})

const TagGroup = defineComponent({
  props: { tags: { type: Array, default: () => [] } },
  setup(props) {
    return () => h('div', { class: 'tag-group' }, props.tags.map((tag) => h('span', { key: tag }, tag)))
  },
})

const WorldCard = defineComponent({
  props: { world: { type: Object, required: true } },
  setup(props) {
    return () =>
      h('article', { class: 'world-card', style: { '--world-accent': props.world.palette.accent } }, [
        h(ResponsiveImage, { asset: getAsset(props.world.heroAssetId), sizes: '(max-width: 760px) 100vw, 40vw' }),
        h('div', { class: 'world-card__body' }, [
          h('div', { class: 'badge-row' }, [
            h(StatusBadge, { value: props.world.status }),
            h(StatusBadge, { value: props.world.evidenceLevel, kind: 'evidence' }),
          ]),
          h('h3', props.world.name),
          h('p', props.world.shortDescription),
          h(TagGroup, { tags: props.world.themeTags }),
          h('div', { class: 'card-actions' }, [
            h('a', { href: `#/worlds/${props.world.id}` }, '进入世界'),
            h('a', { href: `#/worlds/${props.world.id}/series/${props.world.seriesIds[0]}` }, '查看分支'),
          ]),
        ]),
      ])
  },
})

const AssetCard = defineComponent({
  props: { item: { type: Object, required: true } },
  setup(props) {
    return () =>
      h('article', { class: 'asset-card' }, [
        h(ResponsiveImage, { asset: props.item, sizes: '(max-width: 760px) 100vw, 25vw' }),
        h('div', { class: 'asset-card__body' }, [
          h('div', { class: 'badge-row' }, [
            h(StatusBadge, { value: props.item.evidenceLevel, kind: 'evidence' }),
            h('span', { class: 'micro' }, props.item.sourceType),
          ]),
          h('h3', props.item.title),
          h('p', props.item.description),
        ]),
      ])
  },
})

const EvidenceCard = defineComponent({
  props: { item: { type: Object, required: true } },
  setup(props) {
    return () => {
      const image = getAsset(props.item.assetId)
      return h('article', { class: 'evidence-card' }, [
        h(ResponsiveImage, { asset: image, sizes: '(max-width: 760px) 100vw, 33vw' }),
        h('div', { class: 'evidence-card__body' }, [
          h('div', { class: 'badge-row' }, [
            h(StatusBadge, { value: props.item.evidenceLevel, kind: 'evidence' }),
            h('span', { class: 'micro' }, props.item.verifiedAt),
          ]),
          h('h3', props.item.title),
          h('p', props.item.summary),
          h('small', `关联入口：${props.item.relatedRoutes.join('、')}`),
        ]),
      ])
    }
  },
})

const WorldsBlock = defineComponent({
  setup() {
    return () =>
      h('section', { class: 'site-section site-container' }, [
        h(SectionHeader, {
          kicker: '六界门户',
          title: '六个入口，不是一组换背景的卡片。',
          body: '每个世界都有独立气质、阶段、证据边界和下一步协作切口。页面只使用已有资料，不把概念图说成实机。',
        }),
        h('div', { class: 'world-grid' }, worlds.map((world) => h(WorldCard, { key: world.id, world }))),
      ])
  },
})

const CharacterBlock = defineComponent({
  setup() {
    const liluo = characters[0]
    return () =>
      h('section', { class: 'site-section site-container split-layout' }, [
        h('div', [
          h(SectionHeader, {
            kicker: '角色锚点',
            title: '璃落跨越六界，但始终是同一个人。',
            body: liluo.summary,
          }),
          h('p', { class: 'notice' }, liluo.adultStatement),
          h(TagGroup, { tags: liluo.coreIdentity }),
          h('div', { class: 'site-actions' }, [h('a', { class: 'site-button', href: '#/characters/liluo' }, '进入完整角色页')]),
        ]),
        h('div', { class: 'portrait-grid' }, [
          h(ResponsiveImage, { asset: getAsset('liluo-portrait'), sizes: '(max-width: 760px) 100vw, 34vw' }),
          h('div', { class: 'variant-row' }, liluo.worldVariantAssetIds.slice(0, 6).map((id) => h(ResponsiveImage, { key: id, asset: getAsset(id), sizes: '130px' }))),
        ]),
      ])
  },
})

const ExperienceBlock = defineComponent({
  setup() {
    const items = ['世界探索', '互动小说', '地图事件', '角色关系', '状态变化', '长期故事生产']
    return () =>
      h('section', { class: 'site-section site-container' }, [
        h(SectionHeader, {
          kicker: '体验方式',
          title: '官网解释宇宙，但旗舰体验仍在游戏里。',
          body: '互动小说、副本、资料页、证据板和官网图鉴都是同一生产体系的输出，不替代像素风冒险 RPG。',
        }),
        h('div', { class: 'feature-grid' }, items.map((title) => h('article', { key: title }, [h('h3', title), h('p', '作为正式输出形态承载局部体验，并在证据允许时回流到地图、事件和运行层。')]))),
      ])
  },
})

const EvidenceBlock = defineComponent({
  props: { compact: { type: Boolean, default: false } },
  setup(props) {
    return () =>
      h('section', { class: 'site-section site-container' }, [
        h(SectionHeader, {
          kicker: '真实证据',
          title: '概念图和实机截图在这里严格分开。',
          body: '证据页只展示真实截图、文档证据和可追溯文件。Image 2 概念视觉不会被标记为实机。',
        }),
        h('div', { class: 'evidence-grid' }, evidenceItems.slice(0, props.compact ? 3 : evidenceItems.length).map((item) => h(EvidenceCard, { key: item.id, item }))),
        props.compact ? h('div', { class: 'site-actions' }, [h('a', { class: 'site-button', href: '#/evidence' }, '查看全部证据')]) : null,
      ])
  },
})

const GalleryBlock = defineComponent({
  props: { compact: { type: Boolean, default: false } },
  setup(props) {
    const shown = computed(() => assets.filter((item) => item.pageRoles.includes('gallery') || item.pageRoles.includes('home-gallery')).slice(0, props.compact ? 6 : 18))
    return () =>
      h('section', { class: 'site-section site-container' }, [
        h(SectionHeader, {
          kicker: '视觉图鉴',
          title: '先复用已有图，给后续 1000+ 资产留结构。',
          body: '图鉴每项都带来源、证据级别、页面用途和公开状态，新增图会按批次登记。',
        }),
        h('div', { class: 'asset-grid' }, shown.value.map((item) => h(AssetCard, { key: item.id, item }))),
        props.compact ? h('div', { class: 'site-actions' }, [h('a', { class: 'site-button', href: '#/gallery' }, '进入图鉴')]) : null,
      ])
  },
})

const ProductionBlock = defineComponent({
  props: { compact: { type: Boolean, default: false } },
  setup(props) {
    return () =>
      h('section', { class: 'site-section site-container split-layout' }, [
        h('div', [
          h(SectionHeader, {
            kicker: 'AI 原生生产体系',
            title: 'AI 参与生产，不替代证据。',
            body: '官网公开的是“从来源到验证”的路径：概念视觉负责表达方向，真实运行材料负责证明存在。',
          }),
          h('div', { class: 'timeline' }, productionSteps.map((item, index) => h('article', { key: item.title }, [h('span', String(index + 1).padStart(2, '0')), h('h3', item.title), h('p', item.body)]))),
          props.compact ? h('div', { class: 'site-actions' }, [h('a', { class: 'site-button', href: '#/production' }, '查看生产体系')]) : null,
        ]),
        h(ResponsiveImage, { asset: getAsset('story-pipeline-board'), sizes: '(max-width: 760px) 100vw, 44vw' }),
      ])
  },
})

const RoadmapBlock = defineComponent({
  props: { compact: { type: Boolean, default: false } },
  setup(props) {
    return () =>
      h('section', { class: 'site-section site-container' }, [
        h(SectionHeader, { kicker: '近期进展', title: '把能确认的完成项和等待项分开。' }),
        h('div', { class: 'roadmap-grid' }, roadmapItems.slice(0, props.compact ? 3 : roadmapItems.length).map((item) => h('article', { key: item.title }, [h('span', item.phase), h('h3', item.title), h('p', item.body)]))),
      ])
  },
})

const WorldsPage = defineComponent({
  setup() {
    return () => h('div', [h(PageHero, { kicker: '世界门户', title: '一个宇宙的六个主要入口', body: '六界页面承接世界、分支、角色、视觉与证据的长期扩展。' }), h(WorldsBlock), h('section', { class: 'site-section site-container' }, [h(ResponsiveImage, { asset: getAsset('six-domains-panorama'), sizes: '100vw' })])])
  },
})

const WorldDetailPage = defineComponent({
  props: { worldId: { type: String, required: true } },
  setup(props) {
    return () => {
      const world = getWorld(props.worldId) || worlds[0]
      const worldSeries = world.seriesIds.map(getSeries).filter(Boolean)
      const gallery = world.galleryAssetIds.map(getAsset).filter(Boolean)
      const evidence = world.evidenceIds.map((id) => evidenceItems.find((item) => item.id === id)).filter(Boolean)
      return h('div', [
        h(PageHero, { kicker: world.publicPositioning, title: world.name, body: world.longDescription, image: getAsset(world.heroAssetId) }),
        h('section', { class: 'site-section site-container detail-grid' }, [
          h('article', [h('h2', '世界作用'), h('p', world.shortDescription), h(TagGroup, { tags: world.themeTags }), h('div', { class: 'badge-row' }, [h(StatusBadge, { value: world.status }), h(StatusBadge, { value: world.evidenceLevel, kind: 'evidence' })])]),
          h('article', [h('h2', '当前已实现内容'), h('p', evidence.length ? '本世界已有可关联的真实截图。' : '当前不伪造已实现内容，页面只展示概念、制作阶段与下一步方向。')]),
          h('article', [h('h2', '未来扩展方向'), h('ul', world.collaborationNeeds.map((need) => h('li', need)))]),
        ]),
        h('section', { class: 'site-section site-container' }, [h(SectionHeader, { title: '世界分支' }), h('div', { class: 'roadmap-grid' }, worldSeries.map((item) => h('article', { key: item.id }, [h('h3', item.name), h('p', item.premise), h('a', { href: `#/worlds/${world.id}/series/${item.id}` }, '进入分支页')])))]),
        h('section', { class: 'site-section site-container' }, [h(SectionHeader, { title: '精选视觉' }), h('div', { class: 'asset-grid' }, gallery.map((item) => h(AssetCard, { key: item.id, item })))]),
        evidence.length ? h('section', { class: 'site-section site-container' }, [h(SectionHeader, { title: '真实证据' }), h('div', { class: 'evidence-grid' }, evidence.map((item) => h(EvidenceCard, { key: item.id, item })))]) : null,
      ])
    }
  },
})

const SeriesPage = defineComponent({
  props: { worldId: { type: String, required: true }, seriesId: { type: String, required: true } },
  setup(props) {
    return () => {
      const item = getSeries(props.seriesId) || series[0]
      const world = getWorld(props.worldId) || getWorld(item.worldId)
      return h('div', [
        h(PageHero, { kicker: world?.name || '世界分支', title: item.name, body: item.premise, image: getAsset(item.coverAssetId) }),
        h('section', { class: 'site-section site-container detail-grid' }, [
          h('article', [h('h2', '分支定位'), h('p', item.subtitle), h(TagGroup, { tags: item.themeTags })]),
          h('article', [h('h2', '当前状态'), h('div', { class: 'badge-row' }, [h(StatusBadge, { value: item.status }), h(StatusBadge, { value: item.evidenceLevel, kind: 'evidence' })]), h('p', '如果当前只有设定或骨架，页面明确标记阶段，不用空洞文案填满。')]),
          h('article', [h('h2', '返回所属世界'), h('a', { href: `#/worlds/${item.worldId}` }, world?.name || item.worldId)]),
        ]),
      ])
    }
  },
})

const CharactersPage = defineComponent({
  setup() {
    return () => h('div', [h(PageHero, { kicker: '角色档案', title: '以璃落为中心，保留后续角色扩展位。', body: '当前公开角色以璃落为核心，但数据结构支持更多角色和关系入口。' }), h(CharacterBlock), h('section', { class: 'site-section site-container' }, [h(SectionHeader, { title: '跨世界关联' }), h('div', { class: 'world-grid' }, worlds.map((world) => h(WorldCard, { key: world.id, world })))])])
  },
})

const CharacterDetailPage = defineComponent({
  props: { characterId: { type: String, required: true } },
  setup(props) {
    return () => {
      const character = getCharacter(props.characterId) || characters[0]
      return h('div', [
        h(PageHero, { kicker: character.role, title: character.name, body: character.summary, image: getAsset('liluo-portrait') }),
        h('section', { class: 'site-section site-container detail-grid' }, [
          h('article', [h('h2', '成年身份'), h('p', character.adultStatement)]),
          h('article', [h('h2', '不变身份'), h(TagGroup, { tags: character.fixedTraits })]),
          h('article', [h('h2', '可变状态'), h(TagGroup, { tags: character.variableTraits })]),
        ]),
        h('section', { class: 'site-section site-container' }, [h(SectionHeader, { title: '六界形象' }), h('div', { class: 'asset-grid asset-grid--variants' }, character.worldVariantAssetIds.map((id) => h(AssetCard, { key: id, item: getAsset(id) })))]),
        h(EvidenceBlock, { compact: true }),
      ])
    }
  },
})

const GalleryPage = defineComponent({
  setup() {
    const query = ref('')
    const level = ref('all')
    const world = ref('all')
    const filtered = computed(() =>
      assets.filter((item) => {
        const text = `${item.title} ${item.description} ${(item.tags || []).join(' ')}`.toLowerCase()
        return (!query.value || text.includes(query.value.toLowerCase())) && (level.value === 'all' || item.evidenceLevel === level.value) && (world.value === 'all' || item.worldId === world.value)
      }),
    )
    return () =>
      h('div', [
        h(PageHero, { kicker: '视觉图鉴', title: '可筛选、可追溯、可继续扩展。', body: '图鉴当前复用已有视觉与真实截图；后续新增图会先进入队列、审核和 registry。' }),
        h('section', { class: 'site-section site-container' }, [
          h('div', { class: 'filter-bar' }, [
            h('input', { value: query.value, placeholder: '搜索标题、说明或标签', onInput: (event) => (query.value = event.target.value) }),
            h('select', { value: level.value, onChange: (event) => (level.value = event.target.value) }, [h('option', { value: 'all' }, '全部证据级别'), ...Object.entries(evidenceLevels).map(([value, label]) => h('option', { value }, label))]),
            h('select', { value: world.value, onChange: (event) => (world.value = event.target.value) }, [h('option', { value: 'all' }, '全部世界'), ...worlds.map((item) => h('option', { value: item.id }, item.name))]),
            h('button', { type: 'button', onClick: () => { query.value = ''; level.value = 'all'; world.value = 'all' } }, '清除'),
            h('span', `${filtered.value.length} 项`),
          ]),
          h('div', { class: 'asset-grid' }, filtered.value.slice(0, 48).map((item) => h(AssetCard, { key: item.id, item }))),
        ]),
      ])
  },
})

const EvidencePage = defineComponent({ setup: () => () => h('div', [h(PageHero, { kicker: '真实可玩证据', title: '只把真实材料放进证据页。', body: '所有截图均关联来源文件、验证日期和入口。' }), h(EvidenceBlock)]) })
const ProductionPage = defineComponent({ setup: () => () => h('div', [h(PageHero, { kicker: '生产体系', title: '从来源到公开展示的连续路径。', body: '这里解释体系，不用它替代游戏本身。' }), h(ProductionBlock), h('section', { class: 'site-section site-container' }, [h(SectionHeader, { title: '视觉生成队列' }), h('ul', { class: 'clean-list' }, visualPlanBatches.map((item) => h('li', item)))])]) })
const RoadmapPage = defineComponent({ setup: () => () => h('div', [h(PageHero, { kicker: '路线图', title: '近期完成、当前进行和后续等待项。' }), h(RoadmapBlock), h('section', { class: 'site-section site-container' }, [h(SectionHeader, { title: 'R2 与新图说明' }), h('p', '本轮按用户要求优先复用已有图。新图、批量上传和公开发布等待后续视觉方案确认后执行。')])]) })
const DevlogPage = defineComponent({ setup: () => () => h('div', [h(PageHero, { kicker: '开发日志', title: '公开进展只记录可追溯事实。' }), h('section', { class: 'site-section site-container' }, [h('div', { class: 'roadmap-grid' }, devlogEntries.map((item) => h('article', { key: item.title }, [h('span', item.date), h('h3', item.title), h('p', item.body), h('small', item.links.join(' / '))])))])]) })
const CollabPage = defineComponent({ setup: () => () => h('div', [h(PageHero, { kicker: '协作入口', title: '适合进入同一生产链继续往前推的人。', body: '官网不给空泛招募口号，只列出当前能落到项目里的协作切口。' }), h('section', { class: 'site-section site-container' }, [h('div', { class: 'feature-grid' }, collaborationNeeds.map((item) => h('article', { key: item.title }, [h('h3', item.title), h('p', item.body)]))), h('div', { class: 'site-actions' }, footerNavigation.map((item) => h('a', { class: 'site-button', href: `#${item.path}` }, item.label)))])]) })

const PageHero = defineComponent({
  props: {
    kicker: { type: String, default: '' },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    image: { type: Object, default: null },
  },
  setup(props) {
    return () =>
      h('section', { class: ['page-hero', props.image ? 'page-hero--with-image' : ''] }, [
        h('div', { class: 'site-container page-hero__inner' }, [
          h('div', [props.kicker ? h('p', { class: 'site-kicker' }, props.kicker) : null, h('h1', props.title), props.body ? h('p', props.body) : null]),
          props.image ? h(ResponsiveImage, { asset: props.image, priority: true, sizes: '(max-width: 760px) 100vw, 44vw' }) : null,
        ]),
      ])
  },
})
</script>

<style scoped>
:global(body) {
  margin: 0;
  background: #14171b;
}

:global(#app) {
  min-height: 100vh;
}

:global(.site-shell h1),
:global(.site-shell h2),
:global(.site-shell h3),
:global(.site-shell p) {
  margin: 0;
  color: inherit;
  text-indent: 0;
  text-align: left;
  word-break: normal;
}

:global(.site-shell a) {
  font-size: inherit;
}

.site-container {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
}

.site-section {
  padding: 76px 0;
}

.site-kicker {
  color: #e9be76;
  font-size: 0.82rem;
  font-weight: 800;
}

.site-hero,
.page-hero {
  position: relative;
  overflow: hidden;
  background: #14171b;
}

.site-hero {
  min-height: min(760px, 94vh);
  display: grid;
  align-items: end;
}

.site-hero__media,
.site-hero__shade {
  position: absolute;
  inset: 0;
}

.site-hero__shade {
  background:
    linear-gradient(90deg, rgba(9, 11, 15, 0.84), rgba(9, 11, 15, 0.18) 56%, rgba(9, 11, 15, 0.72)),
    linear-gradient(180deg, transparent, rgba(20, 23, 27, 0.96));
}

.site-hero__content {
  position: relative;
  z-index: 1;
  padding: 120px 0 78px;
}

.site-hero h1,
.page-hero h1 {
  max-width: 840px;
  margin-top: 12px;
  font-size: clamp(2.8rem, 7vw, 6.4rem);
  line-height: 0.98;
}

.site-hero p:not(.site-kicker),
.page-hero p,
.section-header p,
.feature-grid p,
.roadmap-grid p,
.detail-grid p,
.timeline p,
.world-card p,
.asset-card p,
.evidence-card p {
  color: #d9d0c0;
  font-size: 1rem;
  line-height: 1.8;
}

.site-hero p:not(.site-kicker) {
  max-width: 760px;
  margin-top: 22px;
  font-size: clamp(1.05rem, 2vw, 1.26rem);
}

.site-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.site-button,
.card-actions a,
.filter-bar button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border: 1px solid rgba(245, 240, 231, 0.22);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  color: #fff1d8;
  font-weight: 800;
  text-decoration: none;
}

.site-button--primary {
  border-color: #e4b96a;
  background: #dba84e;
  color: #17110a;
}

.section-header {
  max-width: 820px;
  margin-bottom: 30px;
}

.section-header h2,
.site-closing h2 {
  margin-top: 10px;
  font-size: clamp(2rem, 4vw, 3.6rem);
  line-height: 1.08;
}

.section-header p {
  margin-top: 16px;
}

.stat-strip,
.feature-grid,
.roadmap-grid,
.detail-grid,
.asset-grid,
.evidence-grid,
.world-grid {
  display: grid;
  gap: 18px;
}

.stat-strip {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.stat-strip article,
.feature-grid article,
.roadmap-grid article,
.detail-grid article,
.timeline article,
.world-card,
.asset-card,
.evidence-card,
.notice {
  border: 1px solid rgba(245, 240, 231, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.045);
}

.stat-strip article {
  padding: 18px;
}

.stat-strip strong {
  display: block;
  color: #f3c979;
  font-size: clamp(1.8rem, 3vw, 2.8rem);
}

.stat-strip span,
.stat-strip small,
.micro,
.evidence-card small,
.roadmap-grid small {
  display: block;
  color: #cfc6b6;
  font-size: 0.84rem;
  line-height: 1.6;
}

.world-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.world-card {
  overflow: hidden;
}

.world-card :deep(.responsive-image img) {
  aspect-ratio: 5 / 3;
}

.world-card__body,
.asset-card__body,
.evidence-card__body,
.feature-grid article,
.roadmap-grid article,
.detail-grid article,
.timeline article {
  padding: 18px;
}

.world-card h3,
.asset-card h3,
.evidence-card h3,
.feature-grid h3,
.roadmap-grid h3,
.detail-grid h2,
.timeline h3 {
  margin-top: 12px;
  font-size: 1.18rem;
  line-height: 1.35;
}

.tag-group,
.badge-row,
.card-actions,
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag-group {
  margin-top: 14px;
}

.tag-group span {
  padding: 5px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #eadfcf;
  font-size: 0.78rem;
}

.card-actions {
  margin-top: 16px;
}

.split-layout,
.page-hero__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 34px;
  align-items: center;
}

.page-hero__inner {
  padding: 78px 0;
}

.page-hero h1 {
  font-size: clamp(2.4rem, 5vw, 5rem);
}

.portrait-grid {
  display: grid;
  grid-template-columns: 0.45fr 1fr;
  gap: 14px;
  align-items: start;
}

.portrait-grid :deep(.responsive-image:first-child img) {
  aspect-ratio: 4 / 5;
}

.variant-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.variant-row :deep(img),
.asset-grid--variants :deep(img) {
  aspect-ratio: 4 / 5;
}

.notice {
  margin: 18px 0;
  padding: 14px;
  color: #ffe6bd;
}

.feature-grid,
.roadmap-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.asset-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.asset-card,
.evidence-card {
  overflow: hidden;
}

.asset-card :deep(img) {
  aspect-ratio: 16 / 10;
}

.evidence-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.evidence-card :deep(img) {
  aspect-ratio: 1908 / 842;
}

.timeline {
  display: grid;
  gap: 12px;
  margin-top: 22px;
}

.timeline span,
.roadmap-grid span {
  color: #e4b96a;
  font-weight: 800;
}

.filter-bar {
  margin-bottom: 22px;
}

.filter-bar input,
.filter-bar select {
  min-height: 42px;
  border: 1px solid rgba(245, 240, 231, 0.18);
  border-radius: 6px;
  padding: 0 12px;
  background: #1b2027;
  color: #fff6e8;
}

.filter-bar input {
  min-width: min(320px, 100%);
}

.clean-list {
  display: grid;
  gap: 10px;
  color: #d9d0c0;
  line-height: 1.7;
}

.site-closing {
  padding-top: 20px;
}

@media (max-width: 980px) {
  .stat-strip,
  .feature-grid,
  .roadmap-grid,
  .asset-grid,
  .evidence-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .split-layout,
  .page-hero__inner,
  .portrait-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .site-container {
    width: min(100% - 28px, 1180px);
  }

  .site-section {
    padding: 54px 0;
  }

  .site-hero {
    min-height: 700px;
  }

  .site-hero__shade {
    background: linear-gradient(180deg, rgba(9, 11, 15, 0.22), rgba(20, 23, 27, 0.96));
  }

  .world-grid,
  .stat-strip,
  .feature-grid,
  .roadmap-grid,
  .asset-grid,
  .evidence-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>

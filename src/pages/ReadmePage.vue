<template>
  <main class="readme-page">
    <section class="readme-hero" aria-labelledby="readme-title">
      <img class="readme-hero__image" :src="assets.hero" alt="璃落宇宙主视觉海报" />
      <div class="readme-hero__shade" aria-hidden="true"></div>
      <div class="readme-shell readme-hero__content">
        <p class="readme-kicker">AI 原生叙事游戏生产体系</p>
        <h1 id="readme-title">璃落宇宙 / Liluo Universe</h1>
        <p class="readme-hero__lead">
          在同一个宇宙里，持续把世界、角色、关系、状态和氛围生产成真正可进入的体验形态。
          当前旗舰入口仍然是像素风冒险 RPG。
        </p>
        <div class="readme-hero__actions" aria-label="主要入口">
          <a class="readme-button readme-button--primary" :href="sourceLinks.offlineRelease" target="_blank" rel="noreferrer">了解离线发行</a>
          <a class="readme-button" :href="sourceLinks.readme" target="_blank" rel="noreferrer">查看仓库 README</a>
        </div>
      </div>
    </section>

    <nav class="readme-nav" aria-label="页面章节">
      <a v-for="item in navItems" :key="item.href" :href="item.href">{{ item.label }}</a>
    </nav>

    <section id="project" class="readme-section readme-shell readme-section--intro">
      <div>
        <p class="readme-kicker">这是什么项目</p>
        <h2>一个角色，六大叙事域，多种正式形态。</h2>
      </div>
      <div class="readme-text-stack">
        <p>
          这里要做的，不是一次性 Demo，也不是只有工具外壳的文档工程，而是一套长期可维护的叙事生产体系。
          同一故事可以先进入大纲、互动小说、副本、资料页，再进入地图章节与正式可玩段落。
        </p>
        <ul class="readme-checklist">
          <li>AI 负责检索、提案、治理、验证和资产沉淀，不替代真实证据。</li>
          <li>所有“可玩、完成、已验证”的结论都要拿真实截图、代码现状或脚本统计说话。</li>
          <li>公开展示区分概念艺术、生产设计和真实运行证据，不混成一类。</li>
        </ul>
      </div>
    </section>

    <section class="readme-shell readme-feature-grid" aria-label="生产体系摘要">
      <article v-for="feature in features" :key="feature.title" class="readme-feature">
        <img :src="feature.image" :alt="feature.alt" loading="lazy" />
        <div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.body }}</p>
        </div>
      </article>
    </section>

    <figure class="readme-shell readme-wide-media">
      <img :src="assets.evidenceBoundary" alt="README 证据边界整板" loading="lazy" />
      <figcaption>
        公开展示先把证据边界说清楚：概念图表达气质和方向，真实可玩证据只放进证据板、截图归档和可验证入口。
      </figcaption>
    </figure>

    <section id="worlds" class="readme-section readme-shell">
      <div class="readme-section__header">
        <p class="readme-kicker">六大叙事域图册</p>
        <h2>同一条生产链，在六种世界压力下展开。</h2>
        <p>
          以下图片是 GPT Image 2 概念艺术，用于公开表达气质、故事压力和协作方向；当前最高证据阶段来自 README 统计文件。
        </p>
      </div>
      <div class="readme-world-grid">
        <article v-for="world in worlds" :key="world.title" class="readme-world-card">
          <img :src="world.image" :alt="`${world.title}三联世界板`" loading="lazy" />
          <div class="readme-world-card__body">
            <div>
              <h3>{{ world.title }}</h3>
              <p>{{ world.body }}</p>
            </div>
            <span class="readme-stage">{{ world.stage }}</span>
          </div>
        </article>
      </div>
    </section>

    <figure class="readme-shell readme-wide-media readme-wide-media--panorama">
      <img :src="assets.panorama" alt="璃落穿行六域的横向总览海报" loading="lazy" />
      <figcaption>
        六大叙事域不是六个互不相干的点子，而是同一个角色、同一套长期关系与同一条生产链的六种正式方向。
      </figcaption>
    </figure>

    <section id="liluo" class="readme-section readme-shell readme-character">
      <div class="readme-section__header">
        <p class="readme-kicker">核心角色</p>
        <h2>璃落穿行诸界，但始终是同一个人。</h2>
        <p>
          璃落始终是同一个 22 岁成年女性角色：娇小、纤细、温柔、弱气、红发、红瞳。
          服装和发型可以随叙事域变化，但身份、气质和长期记忆不能散掉。
        </p>
      </div>
      <div class="readme-character__layout">
        <figure class="readme-portrait">
          <img :src="assets.liluoPortrait" alt="璃落公开基准立绘" loading="lazy" />
          <figcaption>公开基准立绘</figcaption>
        </figure>
        <div class="readme-character__right">
          <img class="readme-panel-image" :src="assets.liluoIdentity" alt="璃落不变身份与可变状态概念图" loading="lazy" />
          <div class="readme-variants">
            <figure v-for="variant in variants" :key="variant.title">
              <img :src="variant.image" :alt="`璃落在${variant.title}中的服装变体`" loading="lazy" />
              <figcaption>{{ variant.title }}</figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>

    <section id="evidence" class="readme-section readme-shell">
      <div class="readme-evidence-header">
        <div>
          <p class="readme-kicker">三十秒证明它真的存在</p>
          <h2>真实截图、构建记录和仓库统计一起说话。</h2>
        </div>
        <div class="readme-stats" aria-label="项目规模快照">
          <div v-for="stat in stats" :key="stat.label" class="readme-stat">
            <strong>{{ stat.value }}</strong>
            <span>{{ stat.label }}</span>
          </div>
        </div>
      </div>

      <div class="readme-proof-grid">
        <figure>
          <img :src="assets.runtimeEvidence" alt="璃落宇宙当前运行证据板" loading="lazy" />
          <figcaption>地图探索、旅途菜单、地图事件对话、存档面板、关系图谱面板和互动小说模式均已有公开实机证据。</figcaption>
        </figure>
        <figure>
          <img :src="assets.restraintState" alt="紧缚状态差分组合面板实机截图" loading="lazy" />
          <figcaption>同一角色可在正式界面里切换、叠加和预览不同状态差分组合。</figcaption>
        </figure>
      </div>
    </section>

    <section id="pipeline" class="readme-section readme-shell">
      <div class="readme-section__header">
        <p class="readme-kicker">从故事到正式形态</p>
        <h2>不是反复改名，而是保留从来源层到运行层的连续路径。</h2>
      </div>
      <figure class="readme-wide-media readme-wide-media--inside">
        <img :src="assets.storyPipeline" alt="同一故事如何进入多种正式形态的流程整板" loading="lazy" />
      </figure>
      <div class="readme-process">
        <article v-for="step in processSteps" :key="step.title">
          <span>{{ step.index }}</span>
          <h3>{{ step.title }}</h3>
          <p>{{ step.body }}</p>
        </article>
      </div>
      <figure class="readme-case-study">
        <img :src="assets.asylumCase" alt="十三号病院故事到可玩链路板" loading="lazy" />
        <figcaption>
          当前最接近“从旧内容走到正式可玩形态”的真实链路，是互动小说副本《十三号病院》。
        </figcaption>
      </figure>
    </section>

    <section id="system" class="readme-section readme-shell readme-system">
      <div class="readme-section__header">
        <p class="readme-kicker">生产体系不是一句口号</p>
        <h2>故事、角色、地图、对话、验证和公开展示，不能各自分裂。</h2>
      </div>
      <div class="readme-system__grid">
        <figure v-for="panel in systemPanels" :key="panel.title">
          <img :src="panel.image" :alt="panel.alt" loading="lazy" />
          <figcaption>
            <strong>{{ panel.title }}</strong>
            {{ panel.body }}
          </figcaption>
        </figure>
      </div>
    </section>

    <section id="collaboration" class="readme-section readme-shell">
      <div class="readme-section__header">
        <p class="readme-kicker">协作入口</p>
        <h2>适合愿意进入同一套宇宙生产链继续往前推的人。</h2>
      </div>
      <div class="readme-collab">
        <figure>
          <img :src="assets.collaboration" alt="璃落宇宙协作角色星图" loading="lazy" />
        </figure>
        <div class="readme-collab__text">
          <ul class="readme-checklist">
            <li>叙事设计：把已成形世界继续拆成真正可执行的章节、任务和支线。</li>
            <li>地图与玩法：把生产设计转成 Phaser 地图、交互点、事件流和可探索循环。</li>
            <li>视觉与 UI：围绕真实世界结构和真实玩法入口建立稳定风格。</li>
            <li>工具与治理：继续补统计、验证、资料治理、RAG 和协作工作流。</li>
          </ul>
          <div class="readme-link-list">
            <a v-for="link in sourceDocLinks" :key="link.href" :href="link.href" target="_blank" rel="noreferrer">
              {{ link.label }}
            </a>
          </div>
        </div>
      </div>
      <figure class="readme-wide-media readme-wide-media--inside readme-closing">
        <img :src="assets.closing" alt="璃落宇宙协作邀请横幅" loading="lazy" />
      </figure>
    </section>

    <section class="readme-shell readme-boundary">
      <h2>内容说明与边界</h2>
      <ul>
        <li>正式登场角色均为成年人。</li>
        <li>项目可能包含冒险、悬疑、灵异、末日、战斗等，并以拘束主题为主。</li>
        <li>正式 canon、长期规则和世界事实仍以人工确认后的权威内容为准。</li>
      </ul>
    </section>
  </main>
</template>

<script setup>
import projectStats from '../../docs/assets/readme/generated/project-stats.json'

const assets = {
  hero: new URL('../../docs/assets/readme/generated/hero-liluo-universe-v3.jpg', import.meta.url).href,
  evidenceBoundary: new URL('../../docs/assets/readme/composites/readme-evidence-boundary-board-v2.png', import.meta.url).href,
  oneStory: new URL('../../docs/assets/readme/generated/one-story-many-forms-v2-base.png', import.meta.url).href,
  fiveLayer: new URL('../../docs/assets/readme/generated/five-layer-production-system-base.png', import.meta.url).href,
  eventNetwork: new URL('../../docs/assets/readme/generated/universe-state-event-network-base.png', import.meta.url).href,
  panorama: new URL('../../docs/assets/readme/generated/six-domains-panorama-v2.png', import.meta.url).href,
  liluoPortrait: new URL('../../docs/assets/readme/generated/liluo-master-character-portrait-v2.png', import.meta.url).href,
  liluoIdentity: new URL('../../docs/assets/readme/generated/liluo-identity-and-state-base.png', import.meta.url).href,
  restraintState: new URL('../../docs/assets/readme/screenshots/README-SHOT-07-restraint-state-combinations.png', import.meta.url).href,
  runtimeEvidence: new URL('../../docs/assets/readme/composites/runtime-evidence-board-v1.png', import.meta.url).href,
  storyPipeline: new URL('../../docs/assets/readme/composites/story-production-pipeline-board-v2.png', import.meta.url).href,
  asylumCase: new URL('../../docs/assets/readme/composites/story-to-playable-case-asylum-board.png', import.meta.url).href,
  relationship: new URL('../../docs/assets/readme/composites/relationship-graph-real-evidence-board.png', import.meta.url).href,
  scale: new URL('../../docs/assets/readme/composites/project-scale-dashboard-v2.png', import.meta.url).href,
  maturity: new URL('../../docs/assets/readme/generated/production-maturity-ladder-base.png', import.meta.url).href,
  aiBoundary: new URL('../../docs/assets/readme/generated/ai-participation-boundary-base.png', import.meta.url).href,
  collaboration: new URL('../../docs/assets/readme/generated/collaboration-role-star-map-base.png', import.meta.url).href,
  roadmap: new URL('../../docs/assets/readme/generated/project-roadmap-base.png', import.meta.url).href,
  closing: new URL('../../docs/assets/readme/generated/closing-invitation-banner.png', import.meta.url).href,
}

const sourceBase = 'https://github.com/liluoaikunbang/liluo_domain/blob/main'

const sourceLinks = {
  readme: `${sourceBase}/README.md`,
  offlineRelease: `${sourceBase}/docs/%E7%B3%BB%E7%BB%9F%E8%AF%B4%E6%98%8E/%E7%A6%BB%E7%BA%BF%E5%8F%91%E8%A1%8C%E4%B8%8EGitHub-Release%E6%B5%81%E7%A8%8B.md`,
}

const sourceDocLinks = [
  { label: '项目愿景', href: `${sourceBase}/docs/%E9%A1%B9%E7%9B%AE%E6%84%BF%E6%99%AF.md` },
  { label: '项目概览', href: `${sourceBase}/docs/%E9%A1%B9%E7%9B%AE%E6%A6%82%E8%A7%88.md` },
  { label: '世界图册', href: `${sourceBase}/docs/readme/%E4%B8%96%E7%95%8C%E5%9B%BE%E5%86%8C.md` },
  { label: '生产体系', href: `${sourceBase}/docs/readme/%E7%94%9F%E4%BA%A7%E4%BD%93%E7%B3%BB.md` },
  { label: '可玩证据', href: `${sourceBase}/docs/readme/%E5%8F%AF%E7%8E%A9%E8%AF%81%E6%8D%AE.md` },
]

const navItems = [
  { label: '项目', href: '#project' },
  { label: '六域', href: '#worlds' },
  { label: '璃落', href: '#liluo' },
  { label: '证据', href: '#evidence' },
  { label: '链路', href: '#pipeline' },
  { label: '协作', href: '#collaboration' },
]

const features = [
  {
    title: '同一故事，多种正式形态',
    body: '同一份故事来源可以进入地图章节、互动小说、副本、资料页和验证文档，而不是各做一套互不相认的内容。',
    image: assets.oneStory,
    alt: '同一故事进入多形态产出的概念板',
  },
  {
    title: '五层生产系统',
    body: '从来源、拆解、运行、验证到公开展示，项目希望把每一层都真正连起来，而不是只停在设定或海报。',
    image: assets.fiveLayer,
    alt: '五层生产系统概念板',
  },
  {
    title: '状态、事件与关系同图治理',
    body: '角色、状态与关系都不是一次性文案，而是同一宇宙中持续回流的运行结构。',
    image: assets.eventNetwork,
    alt: '宇宙状态事件网络概念板',
  },
]

const worldCopy = {
  '慕妮卡帝国': '综合型主世界，承接宫阙、城市、住宅区、仪式秩序与璃落最稳定的长期关系线。',
  '浮光掠影': '都市异常、校园悬疑与港城夜雨并存，也是当前最接近故事向玩法转化的叙事域。',
  '寂土挽歌': '灾后废墟、撤离线、补给点与求生秩序构成的末日线，强调生存、互助与重建。',
  '尘寰问道': '古风旧案、礼法约束、山水异闻与因果抉择最浓的一支，叙事味道强。',
  '咒缚回响': '学院、古堡、海路、誓约与高气质幻想视觉交缠的魔幻线。',
  '星宇织梦': '轨道城、未来装置、殖民边疆与文明边界持续外推的科幻线。',
}

const worldImages = {
  '慕妮卡帝国': new URL('../../docs/assets/readme/composites/world-munika-triptych-board.png', import.meta.url).href,
  '浮光掠影': new URL('../../docs/assets/readme/composites/world-fuguang-triptych-board.png', import.meta.url).href,
  '寂土挽歌': new URL('../../docs/assets/readme/composites/world-jitu-triptych-board.png', import.meta.url).href,
  '尘寰问道': new URL('../../docs/assets/readme/composites/world-chenhuan-triptych-board.png', import.meta.url).href,
  '咒缚回响': new URL('../../docs/assets/readme/composites/world-zhoufu-triptych-board.png', import.meta.url).href,
  '星宇织梦': new URL('../../docs/assets/readme/composites/world-xingyu-triptych-board.png', import.meta.url).href,
}

const worlds = projectStats.coverageSummary.map((world) => ({
  title: world.publicTitle,
  stage: world.stageLabel,
  body: worldCopy[world.publicTitle],
  image: worldImages[world.publicTitle],
}))

const variants = [
  { title: '慕妮卡帝国', image: new URL('../../docs/assets/readme/generated/liluo-munika-variant.png', import.meta.url).href },
  { title: '浮光掠影', image: new URL('../../docs/assets/readme/generated/liluo-fuguang-variant.png', import.meta.url).href },
  { title: '寂土挽歌', image: new URL('../../docs/assets/readme/generated/liluo-jitu-variant.png', import.meta.url).href },
  { title: '尘寰问道', image: new URL('../../docs/assets/readme/generated/liluo-chenhuan-variant.png', import.meta.url).href },
  { title: '咒缚回响', image: new URL('../../docs/assets/readme/generated/liluo-zhoufu-variant.png', import.meta.url).href },
  { title: '星宇织梦', image: new URL('../../docs/assets/readme/generated/liluo-xingyu-variant.png', import.meta.url).href },
]

const stats = [
  { label: '公开叙事域', value: projectStats.counts.publicWorldCount },
  { label: '地图包', value: projectStats.counts.mapPackageCount },
  { label: '故事 Markdown', value: projectStats.counts.storyMarkdownCount },
  { label: '关系边', value: projectStats.outlineGraph.edgeCount },
  { label: '实机截图', value: projectStats.counts.verifiedScreenshotCount },
]

const processSteps = [
  { index: '01', title: '来源层', body: '世界来源 JSON、故事大纲、情节库、角色与关系约束。' },
  { index: '02', title: '生产设计层', body: '把故事拆成任务、地图、对话、事件、互动小说和资料页。' },
  { index: '03', title: '运行层', body: '进入 Phaser 地图探索、菜单、图谱、对话、存档和副本入口。' },
  { index: '04', title: '验证层', body: '构建检查、浏览器回归、路线验证、覆盖统计和 README 证据页。' },
]

const systemPanels = [
  {
    title: '五层生产系统',
    body: '同一宇宙里的故事、角色、地图、对话、验证和公开展示，应当被同一条生产链连接。',
    image: assets.fiveLayer,
    alt: '璃落宇宙五层生产系统概念板',
  },
  {
    title: '状态与事件网络',
    body: '跨世界出现时，真正要被维护的是身份、关系、记忆、状态变化和事件后果。',
    image: assets.eventNetwork,
    alt: '璃落宇宙状态与事件网络概念板',
  },
  {
    title: '关系图谱证据',
    body: '图谱既是公开表达，也是生产界面的证据边界之一。',
    image: assets.relationship,
    alt: '关系图谱真实证据整板',
  },
  {
    title: '规模快照',
    body: '统计来自仓库脚本与 project-stats.json，用来说明规模，而不是替代可玩完成度。',
    image: assets.scale,
    alt: '璃落宇宙公开规模快照',
  },
  {
    title: '成熟度阶梯',
    body: '大纲、生产设计、实机证据与全面可玩不能混为一谈。',
    image: assets.maturity,
    alt: '璃落宇宙生产成熟度阶梯概念板',
  },
  {
    title: 'AI 与人工边界',
    body: 'AI 负责提案、整理、治理、检索和辅助生产，正史确认与玩法落地仍回到仓库和实机证据。',
    image: assets.aiBoundary,
    alt: 'AI 与人工参与边界概念板',
  },
]
</script>

<style scoped>
:global(html) {
  scroll-behavior: smooth;
}

:global(body) {
  margin: 0;
  background: #16171b;
}

:global(#app) {
  min-height: 100vh;
}

.readme-page {
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba(19, 21, 25, 0.18), #16171b 780px),
    #16171b;
  color: #f5f0e7;
  font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif;
  text-align: left;
}

.readme-page :where(h1, h2, h3, p) {
  margin: 0;
  color: inherit;
  text-indent: 0;
  word-break: normal;
}

.readme-page :where(img) {
  display: block;
  max-width: 100%;
}

.readme-shell {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
}

.readme-hero {
  position: relative;
  min-height: min(760px, 96vh);
  display: grid;
  align-items: end;
  overflow: hidden;
}

.readme-hero__image,
.readme-hero__shade {
  position: absolute;
  inset: 0;
}

.readme-hero__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.readme-hero__shade {
  background:
    linear-gradient(90deg, rgba(10, 12, 15, 0.78), rgba(10, 12, 15, 0.25) 58%, rgba(10, 12, 15, 0.68)),
    linear-gradient(180deg, rgba(10, 12, 15, 0.08), rgba(10, 12, 15, 0.92));
}

.readme-hero__content {
  position: relative;
  z-index: 1;
  padding: 120px 0 76px;
}

.readme-kicker {
  color: #e4b96a;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.readme-hero h1 {
  max-width: 860px;
  margin-top: 12px;
  font-size: clamp(2.8rem, 7vw, 6.6rem);
  line-height: 0.96;
  font-weight: 800;
}

.readme-hero__lead {
  max-width: 760px;
  margin-top: 24px;
  color: #f3ead8;
  font-size: clamp(1.05rem, 2vw, 1.35rem);
  line-height: 1.75;
}

.readme-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 34px;
}

.readme-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid rgba(245, 240, 231, 0.34);
  border-radius: 6px;
  background: rgba(18, 20, 23, 0.58);
  color: #fff7ea;
  font-size: 0.96rem;
  font-weight: 700;
  text-decoration: none;
  backdrop-filter: blur(12px);
}

.readme-button--primary {
  border-color: #e4b96a;
  background: #dba84e;
  color: #17110a;
}

.readme-nav {
  position: sticky;
  top: 0;
  z-index: 4;
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(245, 240, 231, 0.1);
  background: rgba(22, 23, 27, 0.86);
  backdrop-filter: blur(16px);
}

.readme-nav a {
  padding: 8px 12px;
  border-radius: 6px;
  color: #eadfcf;
  font-size: 0.9rem;
  text-decoration: none;
}

.readme-nav a:hover,
.readme-nav a:focus-visible {
  background: rgba(228, 185, 106, 0.14);
  color: #fff;
}

.readme-section {
  padding: 76px 0;
}

.readme-section--intro {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 56px;
}

.readme-section h2 {
  margin-top: 10px;
  font-size: clamp(2rem, 4.2vw, 3.8rem);
  line-height: 1.08;
  font-weight: 800;
}

.readme-section__header {
  max-width: 820px;
  margin-bottom: 34px;
}

.readme-section__header p:not(.readme-kicker),
.readme-text-stack p {
  margin-top: 18px;
  color: #d8cfc0;
  font-size: 1rem;
  line-height: 1.9;
}

.readme-checklist {
  display: grid;
  gap: 12px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

.readme-checklist li {
  position: relative;
  padding-left: 20px;
  color: #efe6d7;
  line-height: 1.75;
}

.readme-checklist li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.72em;
  width: 8px;
  height: 8px;
  border: 1px solid #e4b96a;
  border-radius: 50%;
  background: rgba(228, 185, 106, 0.28);
}

.readme-feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.readme-feature,
.readme-world-card,
.readme-stat,
.readme-process article,
.readme-boundary {
  border: 1px solid rgba(245, 240, 231, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.045);
}

.readme-feature {
  overflow: hidden;
}

.readme-feature img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.readme-feature div {
  padding: 18px;
}

.readme-feature h3,
.readme-world-card h3,
.readme-process h3 {
  font-size: 1.08rem;
  line-height: 1.35;
}

.readme-feature p,
.readme-world-card p,
.readme-process p,
.readme-system figcaption,
.readme-proof-grid figcaption,
.readme-case-study figcaption,
.readme-wide-media figcaption {
  margin-top: 10px;
  color: #d8cfc0;
  font-size: 0.94rem;
  line-height: 1.72;
}

.readme-wide-media {
  padding: 54px 0 0;
}

.readme-wide-media--inside {
  padding: 0;
}

.readme-wide-media img,
.readme-proof-grid img,
.readme-case-study img,
.readme-system img,
.readme-collab img,
.readme-panel-image {
  width: 100%;
  border: 1px solid rgba(245, 240, 231, 0.12);
  border-radius: 8px;
  background: #0f1013;
}

.readme-world-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.readme-world-card {
  overflow: hidden;
}

.readme-world-card img {
  width: 100%;
  aspect-ratio: 5 / 3;
  object-fit: cover;
}

.readme-world-card__body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
}

.readme-stage {
  flex: 0 0 auto;
  padding: 5px 8px;
  border: 1px solid rgba(228, 185, 106, 0.38);
  border-radius: 999px;
  color: #f4cb81;
  font-family: Consolas, "Courier New", monospace;
  font-size: 0.76rem;
}

.readme-wide-media--panorama {
  padding-top: 0;
}

.readme-character__layout {
  display: grid;
  grid-template-columns: 0.42fr 1fr;
  gap: 24px;
  align-items: start;
}

.readme-portrait,
.readme-variants figure,
.readme-proof-grid figure,
.readme-case-study,
.readme-system figure,
.readme-collab figure {
  margin: 0;
}

.readme-portrait img {
  width: 100%;
  border: 1px solid rgba(245, 240, 231, 0.12);
  border-radius: 8px;
  background: #0f1013;
}

.readme-portrait figcaption,
.readme-variants figcaption {
  margin-top: 8px;
  color: #cfc5b6;
  font-size: 0.86rem;
  text-align: center;
}

.readme-character__right {
  display: grid;
  gap: 18px;
}

.readme-variants {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.readme-variants img {
  width: 100%;
  aspect-ratio: 4 / 5;
  border: 1px solid rgba(245, 240, 231, 0.1);
  border-radius: 6px;
  background: #0f1013;
  object-fit: cover;
}

.readme-evidence-header {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(320px, 1fr);
  gap: 36px;
  align-items: end;
}

.readme-stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.readme-stat {
  padding: 16px 12px;
  text-align: center;
}

.readme-stat strong {
  display: block;
  color: #f3c979;
  font-size: clamp(1.55rem, 3vw, 2.3rem);
  line-height: 1;
}

.readme-stat span {
  display: block;
  margin-top: 8px;
  color: #d8cfc0;
  font-size: 0.84rem;
}

.readme-proof-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 22px;
  margin-top: 34px;
  align-items: start;
}

.readme-process {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 22px;
}

.readme-process article {
  padding: 18px;
}

.readme-process span {
  display: inline-block;
  margin-bottom: 14px;
  color: #e4b96a;
  font-family: Consolas, "Courier New", monospace;
  font-size: 0.84rem;
}

.readme-case-study {
  display: grid;
  grid-template-columns: 0.55fr 0.45fr;
  gap: 24px;
  align-items: center;
  margin-top: 28px;
}

.readme-system__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.readme-system figcaption {
  padding: 12px 2px 0;
}

.readme-system strong {
  display: block;
  margin-bottom: 4px;
  color: #fff4df;
}

.readme-collab {
  display: grid;
  grid-template-columns: 1fr 0.72fr;
  gap: 28px;
  align-items: start;
}

.readme-collab__text {
  display: grid;
  gap: 22px;
}

.readme-link-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.readme-link-list a {
  padding: 8px 11px;
  border: 1px solid rgba(245, 240, 231, 0.14);
  border-radius: 6px;
  color: #f1d391;
  font-size: 0.9rem;
  text-decoration: none;
}

.readme-closing {
  margin-top: 30px;
}

.readme-boundary {
  margin-bottom: 72px;
  padding: 24px;
}

.readme-boundary h2 {
  font-size: 1.45rem;
}

.readme-boundary ul {
  display: grid;
  gap: 8px;
  margin: 16px 0 0;
  padding-left: 20px;
  color: #d8cfc0;
  line-height: 1.7;
}

@media (max-width: 980px) {
  .readme-section--intro,
  .readme-character__layout,
  .readme-evidence-header,
  .readme-proof-grid,
  .readme-case-study,
  .readme-collab {
    grid-template-columns: 1fr;
  }

  .readme-feature-grid,
  .readme-process,
  .readme-system__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .readme-stats,
  .readme-variants {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .readme-shell {
    width: min(100% - 28px, 1180px);
  }

  .readme-hero {
    min-height: 700px;
  }

  .readme-hero__shade {
    background:
      linear-gradient(180deg, rgba(10, 12, 15, 0.2), rgba(10, 12, 15, 0.95)),
      rgba(10, 12, 15, 0.3);
  }

  .readme-hero__content {
    padding: 96px 0 56px;
  }

  .readme-nav {
    justify-content: flex-start;
    overflow-x: auto;
  }

  .readme-section {
    padding: 54px 0;
  }

  .readme-feature-grid,
  .readme-world-grid,
  .readme-process,
  .readme-system__grid {
    grid-template-columns: 1fr;
  }

  .readme-stats,
  .readme-variants {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .readme-world-card__body {
    display: grid;
  }

  .readme-stage {
    width: max-content;
  }
}
</style>

<template>
  <SiteShellPoster>
    <template v-if="pageKind === 'home'">
      <section class="hero">
        <ResponsiveImage class="hero__media" :asset="heroAsset" :framed="false" priority sizes="100vw" />
        <div class="hero__shade"></div>
        <div class="page-shell hero__content">
          <p class="eyebrow">{{ siteConfig.subtitle }}</p>
          <h1>把同一宇宙做成真正可走进去的旗舰体验，再把它稳定生产成海报、图鉴、证据与协作入口。</h1>
          <p class="hero__summary">{{ siteConfig.summary }}</p>
          <div class="cta-row">
            <RouterLink class="button button--primary" :to="siteConfig.primaryRoute">进入 /game 旗舰入口</RouterLink>
            <RouterLink class="button" to="/worlds">浏览六界海报</RouterLink>
            <RouterLink class="button" to="/evidence">先看真实证据</RouterLink>
          </div>
        </div>
      </section>

      <section class="page-shell section">
        <SectionIntro
          eyebrow="真实规模"
          title="这一轮官网升级，不是换配色，而是把 1248 条视觉计划和 96 条截图任务接入站点结构。"
          body="首页不再只是一张概念图，而是一个会继续长大的公开视觉展台。每一条海报计划都知道自己属于哪个世界、哪个批次、哪种公开边界，也知道什么时候必须回到 /game 去拿真正的证据。"
        />
        <div class="stats-grid">
          <article v-for="stat in siteStats" :key="stat.label" class="stat-card">
            <strong>{{ stat.value }}</strong>
            <span>{{ stat.label }}</span>
            <small>{{ stat.note }}</small>
          </article>
        </div>
      </section>

      <section class="page-shell section">
        <SectionIntro
          eyebrow="六界海报入口"
          title="每个世界都先被当成可停留的生活空间来做，而不是一张空洞设定卡。"
          body="这批页面会把气质、场景、分支、角色变体和可补证据的空位并排呈现，方便我们后续逐批补足。"
        />
        <div class="world-grid">
          <article v-for="world in worlds" :key="world.id" class="world-card">
            <ResponsiveImage :asset="worldCover(world.id)" :framed="false" sizes="(max-width: 780px) 100vw, 33vw" />
            <div class="world-card__body">
              <div class="badge-row">
                <StatusBadge :value="world.status" />
                <StatusBadge :value="world.evidenceLevel" kind="evidence" />
              </div>
              <h2>{{ world.name }}</h2>
              <p>{{ world.shortDescription }}</p>
              <div class="tag-row">
                <span v-for="tag in world.materials.slice(0, 4)" :key="tag">{{ tag }}</span>
              </div>
              <div class="world-card__meta">
                <span>{{ worldSummary(world.id)?.atlas || 0 }} 张 atlas</span>
                <span>{{ worldSummary(world.id)?.branches || 0 }} 张分支海报</span>
                <span>{{ worldSummary(world.id)?.screenshots || 0 }} 条截图任务</span>
              </div>
              <RouterLink class="text-link" :to="`/worlds/${world.id}`">进入这个世界</RouterLink>
            </div>
          </article>
        </div>
      </section>

      <section class="page-shell section section--split">
        <div class="stack">
          <SectionIntro
            eyebrow="旗舰说明"
            title="/game 仍然是正式入口，官网负责让陌生人一眼看懂这个项目为什么值得继续做。"
            body="我们把海报、图鉴、证据页和协作页做得更强，是为了扩大宇宙的入口，不是为了把旗舰体验替换成一堆说明卡片。"
          />
          <div class="feature-points">
            <article>
              <h3>先看海报，再回到运行态</h3>
              <p>所有“已存在”的说法都应该能在证据页和 /game 里被核对，而不只是停留在漂亮图上。</p>
            </article>
            <article>
              <h3>六界不是六个换皮皮肤</h3>
              <p>atlas、分支海报、璃落变体和后续截图任务会一起显示一个世界到底能往哪扩。</p>
            </article>
            <article>
              <h3>协作入口必须具体</h3>
              <p>我们公开的是能认领、能验收、能回流到正式体验的任务，而不是空泛招募口号。</p>
            </article>
          </div>
          <div class="cta-row">
            <RouterLink class="button button--primary" to="/production">查看生产体系</RouterLink>
            <RouterLink class="button" to="/collab">查看协作轨道</RouterLink>
          </div>
        </div>
        <div class="stack stack--media">
          <ResponsiveImage :asset="publishedById('pub-story-to-playable-board')" sizes="(max-width: 900px) 100vw, 44vw" />
          <ResponsiveImage :asset="publishedById('pub-one-story-many-forms')" sizes="(max-width: 900px) 100vw, 44vw" />
        </div>
      </section>

      <section class="page-shell section">
        <SectionIntro
          eyebrow="海报总表"
          title="四层视觉体系已经接进页面数据：跨页海报、世界 atlas、分支预告、璃落角色线。"
          body="它们合起来正好构成 1248 条计划，不再靠手工备注散落在文档里。"
        />
        <div class="layer-grid">
          <article v-for="layer in layerCounts" :key="layer.id" class="layer-card">
            <span>{{ layer.label }}</span>
            <strong>{{ layer.count }}</strong>
            <small>自动计入批次和世界统计</small>
          </article>
        </div>
        <div class="plan-grid">
          <VisualPlanCard
            v-for="entry in homePlanEntries"
            :key="entry.id"
            :entry="entry"
            :preview-asset="planPreview(entry)"
            :world-label="worldName(entry.worldId)"
          />
        </div>
      </section>

      <section class="page-shell section section--split">
        <div class="stack">
          <SectionIntro
            eyebrow="真实证据"
            title="截图、图板和概念海报被明确分层，不再混在同一个画廊里。"
            body="证据页只认真实运行截图、构建共存证明和公开文档证据。首页这里只提前给出最重要的几张，让陌生访客先建立信任。"
          />
          <div class="evidence-list">
            <article v-for="item in evidenceItems.slice(0, 4)" :key="item.id" class="evidence-card">
              <ResponsiveImage :asset="item" :framed="false" sizes="(max-width: 900px) 100vw, 38vw" />
              <div class="evidence-card__body">
                <div class="badge-row">
                  <StatusBadge :value="item.evidenceLevel" kind="evidence" />
                  <StatusBadge :value="item.promptStatus" />
                </div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.proofTarget || item.alt }}</p>
              </div>
            </article>
          </div>
        </div>
        <div class="stack">
          <ResponsiveImage :asset="publishedById('pub-runtime-evidence-board')" sizes="(max-width: 900px) 100vw, 42vw" />
          <div class="screenshot-note">
            <strong>{{ planCounts.screenshotPlan }} 条截图任务</strong>
            <p>其中 {{ planCounts.screenshotCaptured }} 条已接入公开证据，剩余任务已经按世界和系统切分，可以继续逐步补证。</p>
            <RouterLink class="text-link" to="/evidence">进入完整证据页</RouterLink>
          </div>
        </div>
      </section>

      <section class="page-shell section">
        <SectionIntro
          eyebrow="批次推进"
          title="整站已经按 24 张一批切好波次，后续视觉生产可以直接按批次推进。"
          body="Batch 00 是璃落身份基线，Batch 01 是首页品牌波次，B02-B07 是六界第一波 atlas。之后所有扩展批次都能继续接在这套结构后面。"
        />
        <div class="batch-grid">
          <article v-for="batch in batchSummaries.slice(0, 10)" :key="batch.batchId" class="batch-card">
            <span>{{ batch.batchId }}</span>
            <h3>{{ batch.title }}</h3>
            <p>{{ batch.size }} 张，覆盖 {{ batch.worlds.length || 1 }} 个世界维度。</p>
          </article>
        </div>
      </section>

      <section class="page-shell section">
        <SectionIntro
          eyebrow="协作转化"
          title="不是“欢迎加入”，而是“现在就能认领哪条真实轨道”。"
          body="协作页会把任务颗粒度、入口文档、验收方式和长期方向一起说清楚，减少热情被空耗掉。"
        />
        <div class="track-grid">
          <article v-for="track in collaborationTracks.slice(0, 6)" :key="track.id || track.title" class="track-card">
            <h3>{{ track.title }}</h3>
            <p>{{ track.summary }}</p>
            <small>{{ track.quickStart }}</small>
          </article>
        </div>
      </section>
    </template>

    <template v-else-if="pageKind === 'worlds'">
      <section class="page-shell page-hero">
        <div class="stack">
          <p class="eyebrow">六界总览</p>
          <h1>六个世界，六套视觉生产入口。</h1>
          <p>世界页不只展示一张图，而是同时承载已发布素材、atlas 规划、分支海报、截图任务和协作缺口。</p>
        </div>
        <ResponsiveImage :asset="publishedById('pub-six-domains-panorama')" sizes="(max-width: 900px) 100vw, 44vw" />
      </section>
      <section class="page-shell section">
        <div class="world-grid">
          <article v-for="world in worlds" :key="world.id" class="world-card">
            <ResponsiveImage :asset="worldCover(world.id)" :framed="false" sizes="(max-width: 780px) 100vw, 33vw" />
            <div class="world-card__body">
              <h2>{{ world.name }}</h2>
              <p>{{ world.longDescription }}</p>
              <div class="world-card__meta">
                <span>{{ worldSummary(world.id)?.atlas || 0 }} atlas</span>
                <span>{{ worldSummary(world.id)?.branches || 0 }} 分支海报</span>
                <span>{{ worldSummary(world.id)?.published || 0 }} 已接入公开素材</span>
              </div>
              <RouterLink class="text-link" :to="`/worlds/${world.id}`">查看世界详情</RouterLink>
            </div>
          </article>
        </div>
      </section>
    </template>

    <template v-else-if="pageKind === 'world-detail' && currentWorld">
      <section class="page-shell page-hero">
        <div class="stack">
          <p class="eyebrow">{{ currentWorld.publicPositioning }}</p>
          <h1>{{ currentWorld.name }}</h1>
          <p>{{ currentWorld.longDescription }}</p>
          <div class="badge-row">
            <StatusBadge :value="currentWorld.status" />
            <StatusBadge :value="currentWorld.evidenceLevel" kind="evidence" />
          </div>
        </div>
        <ResponsiveImage :asset="worldCover(currentWorld.id)" sizes="(max-width: 900px) 100vw, 44vw" />
      </section>

      <section class="page-shell section section--split">
        <div class="stack">
          <SectionIntro eyebrow="空间骨架" title="这个世界先从会被真实使用的空间切开。" body="每个 zone 都会继续展开成 atlas 波次、局部海报和后续运行证据。" />
          <div class="tag-row tag-row--large">
            <span v-for="zone in currentWorld.zones" :key="zone.id">{{ zone.label }}</span>
          </div>
        </div>
        <div class="stack">
          <SectionIntro eyebrow="生活节奏" title="材质、作息和情绪比巨构空镜更重要。" />
          <div class="feature-points">
            <article>
              <h3>材质</h3>
              <p>{{ currentWorld.materials.join('、') }}</p>
            </article>
            <article>
              <h3>节奏</h3>
              <p>{{ currentWorld.routines.join('、') }}</p>
            </article>
            <article>
              <h3>氛围</h3>
              <p>{{ currentWorld.atmosphere }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="page-shell section">
        <SectionIntro eyebrow="已接入公开素材" title="先看现在已经能摆上站点的世界资产。" />
        <div class="published-grid">
          <article v-for="asset in currentWorldPublished" :key="asset.id" class="published-card">
            <ResponsiveImage :asset="asset" :framed="false" sizes="(max-width: 780px) 100vw, 33vw" />
            <div class="published-card__body">
              <div class="badge-row">
                <StatusBadge :value="asset.evidenceLevel" kind="evidence" />
                <StatusBadge :value="asset.promptStatus" />
              </div>
              <h3>{{ asset.title }}</h3>
              <p>{{ asset.alt }}</p>
            </div>
          </article>
        </div>
      </section>

      <section class="page-shell section">
        <SectionIntro eyebrow="世界计划库" title="atlas、分支预告与璃落变体已经在同一个世界页里被收拢。" />
        <div class="plan-grid">
          <VisualPlanCard
            v-for="entry in currentWorldPlan"
            :key="entry.id"
            :entry="entry"
            :preview-asset="planPreview(entry)"
            :world-label="currentWorld.name"
          />
        </div>
      </section>

      <section class="page-shell section">
        <SectionIntro eyebrow="世界分支" title="每个世界当前公开保留一个系列入口，后续可以继续向下生长。" />
        <div class="track-grid">
          <article v-for="item in currentWorldSeries" :key="item.id" class="track-card">
            <h3>{{ item.name }}</h3>
            <p>{{ item.premise }}</p>
            <RouterLink class="text-link" :to="`/worlds/${item.worldId}/series/${item.id}`">进入这个系列</RouterLink>
          </article>
        </div>
      </section>
    </template>

    <template v-else-if="pageKind === 'series' && currentSeries">
      <section class="page-shell page-hero">
        <div class="stack">
          <p class="eyebrow">{{ currentWorld?.name || '系列入口' }}</p>
          <h1>{{ currentSeries.name }}</h1>
          <p>{{ currentSeries.premise }}</p>
          <div class="badge-row">
            <StatusBadge :value="currentSeries.status" />
            <StatusBadge :value="currentSeries.evidenceLevel" kind="evidence" />
          </div>
        </div>
        <ResponsiveImage :asset="seriesCover" sizes="(max-width: 900px) 100vw, 44vw" />
      </section>

      <section class="page-shell section">
        <SectionIntro eyebrow="系列公开页" title="这里只展示公开安全预告，不提前写死真正剧情结果。" body="系列页会优先显示与该系列挂接的分支海报和世界证据，给访客一个进入理由，而不是一次性倒出所有设定。" />
        <div class="plan-grid">
          <VisualPlanCard
            v-for="entry in currentSeriesPlan"
            :key="entry.id"
            :entry="entry"
            :preview-asset="planPreview(entry)"
            :world-label="worldName(entry.worldId)"
          />
        </div>
      </section>
    </template>

    <template v-else-if="pageKind === 'characters'">
      <section class="page-shell page-hero">
        <div class="stack">
          <p class="eyebrow">角色入口</p>
          <h1>璃落不是换服装的模特，而是六界都要保持连续性的角色锚点。</h1>
          <p>{{ liluoProfile.summary }}</p>
        </div>
        <ResponsiveImage :asset="publishedById('pub-liluo-portrait')" sizes="(max-width: 900px) 100vw, 42vw" />
      </section>

      <section class="page-shell section section--split">
        <div class="stack">
          <SectionIntro eyebrow="固定部分" title="成年、身份稳定、跨世界仍然能一眼认出来。" />
          <div class="tag-row tag-row--large">
            <span v-for="item in liluoProfile.fixedTraits" :key="item">{{ item }}</span>
          </div>
        </div>
        <div class="stack">
          <SectionIntro eyebrow="可变部分" title="外观、工作姿态、世界适配与情绪呈现可以继续增长。" />
          <div class="tag-row tag-row--large">
            <span v-for="item in liluoProfile.variableTraits" :key="item">{{ item }}</span>
          </div>
        </div>
      </section>

      <section class="page-shell section">
        <SectionIntro eyebrow="角色变体库" title="所有世界变体都已经接成公开可浏览的计划与已发布对照。" />
        <div class="plan-grid">
          <VisualPlanCard
            v-for="entry in liluoEntries"
            :key="entry.id"
            :entry="entry"
            :preview-asset="planPreview(entry)"
            :world-label="worldName(entry.worldId)"
          />
        </div>
      </section>
    </template>

    <template v-else-if="pageKind === 'character-detail'">
      <section class="page-shell page-hero">
        <div class="stack">
          <p class="eyebrow">璃落档案</p>
          <h1>同一个人，在六界里以不同工作姿态与情绪出现。</h1>
          <p>{{ liluoProfile.summary }}</p>
        </div>
        <ResponsiveImage :asset="publishedById('pub-liluo-identity-base')" sizes="(max-width: 900px) 100vw, 42vw" />
      </section>
      <section class="page-shell section">
        <div class="published-grid">
          <article v-for="asset in liluoPublished" :key="asset.id" class="published-card">
            <ResponsiveImage :asset="asset" :framed="false" sizes="(max-width: 780px) 100vw, 33vw" />
            <div class="published-card__body">
              <h3>{{ asset.title }}</h3>
              <p>{{ asset.alt }}</p>
            </div>
          </article>
        </div>
      </section>
    </template>

    <template v-else-if="pageKind === 'gallery'">
      <section class="page-shell page-hero">
        <div class="stack">
          <p class="eyebrow">视觉图鉴</p>
          <h1>已发布素材与 1248 条计划都能在这里被筛选和翻页。</h1>
          <p>默认按 24 项一页浏览，既保留大规模计划感，也避免首页一次性吞掉整库内容。</p>
        </div>
        <ResponsiveImage :asset="publishedById('pub-scale-dashboard-board')" sizes="(max-width: 900px) 100vw, 44vw" />
      </section>

      <section class="page-shell section">
        <div class="filter-bar">
          <button class="chip" :class="{ 'chip--active': galleryMode === 'planned' }" @click="setGalleryMode('planned')">计划库</button>
          <button class="chip" :class="{ 'chip--active': galleryMode === 'published' }" @click="setGalleryMode('published')">已发布</button>
          <input v-model="galleryQuery" type="text" placeholder="搜索标题、标签或说明" />
          <select v-model="galleryWorld">
            <option value="all">全部世界</option>
            <option v-for="world in worlds" :key="world.id" :value="world.id">{{ world.name }}</option>
          </select>
          <select v-model="galleryCollection">
            <option value="all">全部类型</option>
            <option value="general-cross-site">跨页海报</option>
            <option value="world-atlas">世界 atlas</option>
            <option value="story-branch">分支海报</option>
            <option value="liluo-character">璃落角色线</option>
          </select>
        </div>

        <p class="gallery-meta">当前 {{ galleryTotal }} 项，第 {{ galleryPage }} / {{ galleryPageCount }} 页。</p>

        <div v-if="galleryMode === 'planned'" class="plan-grid">
          <VisualPlanCard
            v-for="entry in pagedPlannedGallery"
            :key="entry.id"
            :entry="entry"
            :preview-asset="planPreview(entry)"
            :world-label="worldName(entry.worldId)"
          />
        </div>

        <div v-else class="published-grid">
          <article v-for="asset in pagedPublishedGallery" :key="asset.id" class="published-card">
            <ResponsiveImage :asset="asset" :framed="false" sizes="(max-width: 780px) 100vw, 33vw" />
            <div class="published-card__body">
              <div class="badge-row">
                <StatusBadge :value="asset.evidenceLevel" kind="evidence" />
                <StatusBadge :value="asset.promptStatus" />
              </div>
              <h3>{{ asset.title }}</h3>
              <p>{{ asset.alt }}</p>
            </div>
          </article>
        </div>

        <div class="pager">
          <button class="button" :disabled="galleryPage <= 1" @click="galleryPage -= 1">上一页</button>
          <button class="button" :disabled="galleryPage >= galleryPageCount" @click="galleryPage += 1">下一页</button>
        </div>
      </section>
    </template>

    <template v-else-if="pageKind === 'evidence'">
      <section class="page-shell page-hero">
        <div class="stack">
          <p class="eyebrow">真实证据页</p>
          <h1>只把真实截图、公开图板与可复核构建关系放进这里。</h1>
          <p>概念海报和 Image 2 计划不会冒充成“已经能玩到的内容”。这页是整个大升级的可信度底座。</p>
        </div>
        <ResponsiveImage :asset="publishedById('pub-evidence-boundary-board')" sizes="(max-width: 900px) 100vw, 44vw" />
      </section>

      <section class="page-shell section">
        <SectionIntro eyebrow="已接入截图" title="当前公开可展示的真实运行截图" />
        <div class="published-grid">
          <article v-for="asset in evidenceItems" :key="asset.id" class="published-card">
            <ResponsiveImage :asset="asset" :framed="false" sizes="(max-width: 780px) 100vw, 33vw" />
            <div class="published-card__body">
              <div class="badge-row">
                <StatusBadge :value="asset.evidenceLevel" kind="evidence" />
                <StatusBadge :value="asset.promptStatus" />
              </div>
              <h3>{{ asset.title }}</h3>
              <p>{{ asset.proofTarget || asset.alt }}</p>
            </div>
          </article>
        </div>
      </section>

      <section class="page-shell section">
        <SectionIntro eyebrow="截图任务书" title="96 条截图任务已经按世界与系统拆开。" />
        <div class="track-grid">
          <article v-for="item in screenshotBriefs.slice(0, 18)" :key="item.id" class="track-card">
            <div class="badge-row">
              <StatusBadge :value="item.status === 'captured' ? 'captured' : 'planned'" />
              <StatusBadge :value="item.evidenceLevel" kind="evidence" />
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.proofTarget }}</p>
            <small>{{ item.routeOrEntry }}</small>
          </article>
        </div>
      </section>
    </template>

    <template v-else-if="pageKind === 'production'">
      <section class="page-shell page-hero">
        <div class="stack">
          <p class="eyebrow">生产体系</p>
          <h1>把来源、计划、海报、截图和 /game 回流接成一条公开可讲的链路。</h1>
          <p>这次升级把视觉批次、证据边界和协作轨道都接进了一个站点里，终于能把“体系”讲清楚，而不是只说愿景。</p>
        </div>
        <ResponsiveImage :asset="publishedById('pub-story-pipeline')" sizes="(max-width: 900px) 100vw, 44vw" />
      </section>

      <section class="page-shell section">
        <SectionIntro eyebrow="生产层" title="五层生产系统与公开页面是一一对位的。" />
        <div class="track-grid">
          <article v-for="phase in productionPhases" :key="phase.id || phase.title" class="track-card">
            <h3>{{ phase.title }}</h3>
            <p>{{ phase.summary || phase.body }}</p>
          </article>
        </div>
      </section>

      <section class="page-shell section">
        <SectionIntro eyebrow="层级统计" title="四层视觉计划都已纳入批次和世界统计。" />
        <div class="layer-grid">
          <article v-for="layer in layerCounts" :key="layer.id" class="layer-card">
            <span>{{ layer.label }}</span>
            <strong>{{ layer.count }}</strong>
            <small>可直接进入图鉴或批次推进</small>
          </article>
        </div>
      </section>

      <section class="page-shell section">
        <SectionIntro eyebrow="系统海报" title="支撑生产说明的视觉板已经并入这一页。" />
        <div class="published-grid">
          <article
            v-for="asset in publishedAssets.filter((item) => item.pageRoles.includes('production')).slice(0, 9)"
            :key="asset.id"
            class="published-card"
          >
            <ResponsiveImage :asset="asset" :framed="false" sizes="(max-width: 780px) 100vw, 33vw" />
            <div class="published-card__body">
              <h3>{{ asset.title }}</h3>
              <p>{{ asset.alt }}</p>
            </div>
          </article>
        </div>
      </section>
    </template>

    <template v-else-if="pageKind === 'roadmap'">
      <section class="page-shell page-hero">
        <div class="stack">
          <p class="eyebrow">路线图</p>
          <h1>用真实批次和真实待办来讲路线，而不是用“愿景词”顶替推进状态。</h1>
          <p>接下来首页和六界的第一波已经够厚，后续可以继续沿着 atlas、分支、截图和协作线向下铺开。</p>
        </div>
        <ResponsiveImage :asset="publishedById('pub-roadmap-base')" sizes="(max-width: 900px) 100vw, 44vw" />
      </section>

      <section class="page-shell section">
        <div class="track-grid">
          <article v-for="item in roadmapItems" :key="item.id || item.title" class="track-card">
            <h3>{{ item.title }}</h3>
            <p>{{ item.body }}</p>
            <small>{{ item.phase }}</small>
          </article>
        </div>
      </section>

      <section class="page-shell section">
        <SectionIntro eyebrow="批次切片" title="前 12 个批次能直接说明下一阶段怎么做。" />
        <div class="batch-grid">
          <article v-for="batch in batchSummaries.slice(0, 12)" :key="batch.batchId" class="batch-card">
            <span>{{ batch.batchId }}</span>
            <h3>{{ batch.title }}</h3>
            <p>{{ batch.size }} 张 / {{ batch.promptReady }} 条已 prompt-ready</p>
          </article>
        </div>
      </section>
    </template>

    <template v-else-if="pageKind === 'devlog'">
      <section class="page-shell page-hero">
        <div class="stack">
          <p class="eyebrow">开发日志</p>
          <h1>公开进展只记录能被后续接手的人继续推进的事实。</h1>
          <p>这页不做流水账，而是把真正有交接价值的动作、入口和状态留出来。</p>
        </div>
        <ResponsiveImage :asset="publishedById('pub-scale-dashboard-base')" sizes="(max-width: 900px) 100vw, 44vw" />
      </section>

      <section class="page-shell section">
        <div class="track-grid">
          <article v-for="item in devlogEntries" :key="item.id || item.title" class="track-card">
            <h3>{{ item.title }}</h3>
            <p>{{ item.body }}</p>
            <small>{{ item.date }}</small>
          </article>
        </div>
      </section>
    </template>

    <template v-else-if="pageKind === 'collab'">
      <section class="page-shell page-hero">
        <div class="stack">
          <p class="eyebrow">协作页</p>
          <h1>把愿意帮忙的人直接送到真实任务轨道上。</h1>
          <p>这一页的目标不是“看起来热闹”，而是让陌生人知道自己能在哪条轨道上立刻贡献，并且如何被验收。</p>
        </div>
        <ResponsiveImage :asset="publishedById('pub-collaboration-star-map')" sizes="(max-width: 900px) 100vw, 44vw" />
      </section>

      <section class="page-shell section">
        <div class="track-grid">
          <article v-for="track in collaborationTracks" :key="track.id || track.title" class="track-card">
            <h3>{{ track.title }}</h3>
            <p>{{ track.summary }}</p>
            <small>{{ track.quickStart }}</small>
          </article>
        </div>
      </section>

      <section class="page-shell section section--split">
        <div class="stack">
          <SectionIntro eyebrow="为什么现在值得加入" title="因为站点已经把世界、素材、批次和证据都接好了。" body="协作者不会再面对一个只有口号的首页，而是能马上看到哪些内容已经公开、哪些内容只差落图、哪些内容还在等真实截图补齐。" />
        </div>
        <ResponsiveImage :asset="publishedById('pub-closing-banner')" sizes="(max-width: 900px) 100vw, 42vw" />
      </section>
    </template>
  </SiteShellPoster>
</template>

<script setup>
import { computed, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import ResponsiveImage from '../components/site/ResponsiveImage.vue'
import SectionIntro from '../components/site/SectionIntro.vue'
import SiteShellPoster from '../components/site/SiteShellPoster.vue'
import StatusBadge from '../components/site/StatusBadge.vue'
import VisualPlanCard from '../components/site/VisualPlanCard.vue'
import {
  batchSummaries,
  collaborationTracks,
  devlogEntries,
  evidenceItems,
  getPublishedAsset,
  getSeries,
  getSeriesForWorld,
  getWorld,
  getWorldPublishedAssets,
  getWorldSummary,
  layerCounts,
  liluoProfile,
  planCounts,
  productionPhases,
  publishedAssets,
  roadmapItems,
  screenshotBriefs,
  siteConfig,
  siteStats,
  visualRegistry,
  worlds,
} from '../content/site/siteCatalog'

const route = useRoute()
const heroAsset = getPublishedAsset('pub-home-hero')

const pageKind = computed(() => {
  if (route.name === 'site-world-detail') return 'world-detail'
  if (route.name === 'site-series') return 'series'
  if (route.name === 'site-character-detail') return 'character-detail'
  return String(route.name || 'site-home').replace('site-', '')
})

const currentWorld = computed(() => getWorld(String(route.params.worldId || '')) || null)
const currentSeries = computed(() => getSeries(String(route.params.seriesId || '')) || null)
const currentWorldSeries = computed(() => (currentWorld.value ? getSeriesForWorld(currentWorld.value.id) : []))
const currentWorldPublished = computed(() => (currentWorld.value ? getWorldPublishedAssets(currentWorld.value.id) : []))
const currentWorldPlan = computed(() =>
  currentWorld.value ? visualRegistry.filter((item) => item.worldId === currentWorld.value.id).slice(0, 18) : [],
)
const currentSeriesPlan = computed(() =>
  currentSeries.value ? visualRegistry.filter((item) => item.seriesId === currentSeries.value.id).slice(0, 18) : [],
)
const liluoEntries = computed(() => visualRegistry.filter((item) => item.collection === 'liluo-character').slice(0, 18))
const liluoPublished = computed(() => publishedAssets.filter((item) => item.group === 'characters'))
const homePlanEntries = computed(() => visualRegistry.slice(0, 12))
const seriesCover = computed(() => {
  if (currentSeries.value?.coverAssetId) return getPublishedAsset(currentSeries.value.coverAssetId)
  if (currentWorld.value) return worldCover(currentWorld.value.id)
  return heroAsset
})

const galleryMode = ref('planned')
const galleryQuery = ref('')
const galleryWorld = ref('all')
const galleryCollection = ref('all')
const galleryPage = ref(1)
const pageSize = 24

const filteredPlannedGallery = computed(() =>
  visualRegistry.filter((item) => {
    const text = `${item.title} ${item.brief?.subject || ''} ${(item.tags || []).join(' ')}`.toLowerCase()
    const matchQuery = !galleryQuery.value || text.includes(galleryQuery.value.toLowerCase())
    const matchWorld = galleryWorld.value === 'all' || item.worldId === galleryWorld.value
    const matchCollection = galleryCollection.value === 'all' || item.collection === galleryCollection.value
    return matchQuery && matchWorld && matchCollection
  }),
)

const filteredPublishedGallery = computed(() =>
  publishedAssets.filter((item) => {
    const text = `${item.title} ${item.alt || ''} ${(item.pageRoles || []).join(' ')}`.toLowerCase()
    const matchQuery = !galleryQuery.value || text.includes(galleryQuery.value.toLowerCase())
    const matchWorld = galleryWorld.value === 'all' || item.worldId === galleryWorld.value
    if (galleryCollection.value === 'all') return matchQuery && matchWorld
    const expectedGroup =
      galleryCollection.value === 'liluo-character'
        ? 'characters'
        : galleryCollection.value === 'world-atlas'
          ? 'worlds'
          : galleryCollection.value === 'story-branch'
            ? 'worlds'
            : null
    return matchQuery && matchWorld && (!expectedGroup || item.group === expectedGroup)
  }),
)

const galleryTotal = computed(() => (galleryMode.value === 'planned' ? filteredPlannedGallery.value.length : filteredPublishedGallery.value.length))
const galleryPageCount = computed(() => Math.max(1, Math.ceil(galleryTotal.value / pageSize)))
const pagedPlannedGallery = computed(() => filteredPlannedGallery.value.slice((galleryPage.value - 1) * pageSize, galleryPage.value * pageSize))
const pagedPublishedGallery = computed(() => filteredPublishedGallery.value.slice((galleryPage.value - 1) * pageSize, galleryPage.value * pageSize))

watch([galleryMode, galleryQuery, galleryWorld, galleryCollection], () => {
  galleryPage.value = 1
})

watch(galleryPageCount, (count) => {
  if (galleryPage.value > count) galleryPage.value = count
})

watchEffect(() => {
  const titles = {
    home: '璃落宇宙官网升级版',
    worlds: '六界总览 / 璃落宇宙',
    'world-detail': `${currentWorld.value?.name || '世界详情'} / 璃落宇宙`,
    series: `${currentSeries.value?.name || '系列入口'} / 璃落宇宙`,
    characters: '角色入口 / 璃落宇宙',
    'character-detail': '璃落档案 / 璃落宇宙',
    gallery: '视觉图鉴 / 璃落宇宙',
    evidence: '真实证据 / 璃落宇宙',
    production: '生产体系 / 璃落宇宙',
    roadmap: '路线图 / 璃落宇宙',
    devlog: '开发日志 / 璃落宇宙',
    collab: '协作页 / 璃落宇宙',
  }
  document.title = titles[pageKind.value] || '璃落宇宙'
})

function setGalleryMode(mode) {
  galleryMode.value = mode
}

function publishedById(id) {
  return getPublishedAsset(id)
}

function planPreview(entry) {
  return getPublishedAsset(entry.previewAssetId) || heroAsset
}

function worldCover(worldId) {
  return (
    getPublishedAsset(`pub-world-${worldId}-triptych`) ||
    getPublishedAsset(`pub-world-${worldId}-poster`) ||
    getPublishedAsset(`pub-world-${worldId}-scene`) ||
    heroAsset
  )
}

function worldName(worldId) {
  return getWorld(worldId)?.name || ''
}

function worldSummary(worldId) {
  return getWorldSummary(worldId)
}
</script>

<style scoped>
:global(body) {
  margin: 0;
  background: #fff9f3;
}

:global(#app) {
  min-height: 100vh;
}

:global(*) {
  box-sizing: border-box;
}

.page-shell {
  width: min(1240px, calc(100% - 36px));
  margin: 0 auto;
}

.section {
  padding-top: 76px;
}

.hero,
.page-hero {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid rgba(24, 55, 93, 0.08);
}

.hero {
  min-height: min(920px, 100vh);
}

.hero__media,
.hero__shade {
  position: absolute;
  inset: 0;
}

.hero__shade {
  background:
    linear-gradient(90deg, rgba(255, 248, 240, 0.92), rgba(255, 248, 240, 0.48) 46%, rgba(255, 248, 240, 0.82)),
    linear-gradient(180deg, rgba(255, 248, 240, 0.12), rgba(255, 248, 240, 0.94));
}

.hero__content {
  position: relative;
  z-index: 2;
  display: grid;
  align-content: end;
  min-height: min(920px, 100vh);
  padding: 150px 0 88px;
}

.eyebrow {
  margin: 0 0 14px;
  color: #a4581a;
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1,
h2,
h3,
p,
small,
strong,
span {
  margin: 0;
}

h1 {
  max-width: 920px;
  color: #13233b;
  font-size: clamp(3rem, 6vw, 6.6rem);
  line-height: 0.95;
  letter-spacing: -0.03em;
}

.hero__summary,
.page-hero p,
.world-card p,
.published-card p,
.track-card p,
.batch-card p,
.stat-card small,
.layer-card small,
.screenshot-note p,
.feature-points p,
.gallery-meta {
  color: #536477;
  line-height: 1.8;
}

.hero__summary {
  max-width: 760px;
  margin-top: 24px;
  font-size: 1.08rem;
}

.cta-row,
.badge-row,
.tag-row,
.world-card__meta,
.pager,
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.cta-row {
  margin-top: 30px;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 0 18px;
  border: 1px solid rgba(24, 55, 93, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: #18375d;
  font-weight: 800;
  text-decoration: none;
}

.button--primary {
  background: #18375d;
  color: #fff8ef;
}

.button:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.text-link {
  color: #18375d;
  font-weight: 800;
  text-decoration: none;
}

.stats-grid,
.world-grid,
.plan-grid,
.published-grid,
.layer-grid,
.batch-grid,
.track-grid,
.evidence-list,
.feature-points {
  display: grid;
  gap: 18px;
}

.stats-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin-top: 28px;
}

.stat-card,
.world-card,
.published-card,
.track-card,
.batch-card,
.layer-card,
.screenshot-note,
.feature-points article {
  overflow: hidden;
  border: 1px solid rgba(24, 55, 93, 0.08);
  border-radius: 28px;
  background: rgba(255, 253, 250, 0.9);
  box-shadow: 0 18px 50px rgba(24, 44, 71, 0.06);
}

.stat-card,
.layer-card,
.batch-card,
.track-card,
.screenshot-note,
.feature-points article {
  padding: 22px;
}

.stat-card strong,
.layer-card strong {
  display: block;
  color: #18375d;
  font-size: clamp(2rem, 3vw, 3rem);
  line-height: 1;
}

.stat-card span,
.layer-card span {
  display: block;
  margin-top: 12px;
  color: #18375d;
  font-weight: 800;
}

.world-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 30px;
}

.world-card,
.published-card,
.evidence-card {
  display: grid;
}

.world-card__body,
.published-card__body,
.evidence-card__body {
  display: grid;
  gap: 12px;
  padding: 18px 18px 22px;
}

.world-card h2,
.published-card h3,
.track-card h3,
.batch-card h3,
.feature-points h3,
.evidence-card h3 {
  color: #16283f;
  font-size: 1.24rem;
  line-height: 1.35;
}

.tag-row span {
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(233, 239, 247, 0.95);
  color: #39506f;
  font-size: 0.82rem;
  font-weight: 700;
}

.tag-row--large {
  gap: 10px;
}

.world-card__meta {
  color: #7d8895;
  font-size: 0.84rem;
}

.section--split,
.page-hero {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 28px;
  align-items: start;
  padding-top: 82px;
}

.stack {
  display: grid;
  gap: 18px;
}

.stack--media {
  align-content: start;
}

.feature-points {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.layer-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 28px;
}

.plan-grid,
.published-grid,
.track-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 28px;
}

.batch-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin-top: 28px;
}

.batch-card span,
.track-card small {
  color: #7b8896;
  font-size: 0.82rem;
  line-height: 1.7;
}

.filter-bar {
  margin-bottom: 18px;
}

.filter-bar input,
.filter-bar select {
  min-height: 46px;
  padding: 0 14px;
  border: 1px solid rgba(24, 55, 93, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: #18375d;
}

.filter-bar input {
  min-width: min(300px, 100%);
  flex: 1 1 260px;
}

.chip {
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid rgba(24, 55, 93, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.74);
  color: #18375d;
  font-weight: 800;
}

.chip--active {
  background: #18375d;
  color: #fff8ef;
}

.pager {
  justify-content: space-between;
  margin-top: 22px;
}

@media (max-width: 1100px) {
  .stats-grid,
  .batch-grid,
  .layer-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .world-grid,
  .plan-grid,
  .published-grid,
  .track-grid,
  .feature-points {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .section--split,
  .page-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .page-shell {
    width: min(100% - 24px, 1240px);
  }

  .hero {
    min-height: 780px;
  }

  .hero__content {
    min-height: 780px;
    padding-top: 118px;
  }

  .stats-grid,
  .world-grid,
  .plan-grid,
  .published-grid,
  .track-grid,
  .layer-grid,
  .batch-grid,
  .feature-points {
    grid-template-columns: 1fr;
  }

  .section,
  .page-hero,
  .section--split {
    padding-top: 56px;
  }
}
</style>

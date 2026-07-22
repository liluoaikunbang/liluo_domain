<template>
  <section class="plot-panel" aria-label="情节条目">
    <div class="toolbar">
      <label><span>搜索情节</span><input v-model="keyword" type="search" placeholder="标题、标签或内容"></label>
      <label><span>使用状态</span><select v-model="usage"><option value="all">全部</option><option value="unused">未完成使用</option><option value="partial">部分使用</option><option value="used">已使用</option></select></label>
      <label><span>偏向世界</span><select v-model="worldBias"><option value="all">全部</option><option value="general">无特定偏向</option><option v-for="world in worlds" :key="world" :value="world">{{ world }}</option></select></label>
      <label><span>普通标签</span><select v-model="tag"><option value="all">全部普通标签</option><option v-for="option in tags" :key="option" :value="option">{{ option }}</option></select></label>
      <label><span>紧缚标签</span><select v-model="bondageTag"><option value="all">全部紧缚标签</option><option v-for="option in bondageTags" :key="option" :value="option">{{ option }}</option></select></label>
      <span class="count">{{ visibleGroups.length }} 个大情节 · {{ entries.length }} 个小情节</span>
    </div>
    <div class="browser">
      <GameScrollArea class="group-list">
        <h3>大情节</h3>
        <button v-for="group in visibleGroups" :key="group.id" type="button" :class="{ active: selectedGroupId === group.id }" @click="selectedGroupId = group.id">
          <strong>{{ group.title }}</strong><small>{{ groupEntryCount(group.id) }} 条</small>
          <span>{{ group.summary }}</span>
        </button>
        <p v-if="!visibleGroups.length" class="empty">没有符合条件的大情节。</p>
      </GameScrollArea>
      <GameScrollArea class="entry-list">
        <h3>小情节</h3>
        <button v-for="entry in groupEntries" :key="entry.id" type="button" :class="{ active: selected?.id === entry.id }" @click="selectedId = entry.id">
          <span>{{ entry.id }}</span><strong>{{ entry.title }}</strong><small>{{ usageLabel(entry) }}</small>
        </button>
        <p v-if="!groupEntries.length" class="empty">该组没有符合条件的小情节。</p>
      </GameScrollArea>
      <GameScrollArea class="detail">
        <article v-if="selected">
          <header><span>{{ selected.id }}</span><h3>{{ selected.title }}</h3><small>{{ usageLabel(selected) }}</small></header>
          <p>{{ selected.summary }}</p>
          <section class="development" aria-label="情节发展">
            <h4>情节发展</h4>
            <dl>
              <dt>核心前提</dt><dd>{{ selected.development.premise }}</dd>
              <dt>升级链</dt><dd>{{ selected.development.escalation }}</dd>
              <dt>关键转折</dt><dd>{{ selected.development.turn }}</dd>
              <dt>持续后果</dt><dd>{{ selected.development.consequence }}</dd>
            </dl>
          </section>
          <dl>
            <dt>偏向世界</dt><dd>{{ selected.worldBiases.join('、') || '无特定偏向' }}</dd>
            <dt>出现人物</dt><dd>{{ selected.characters.join('、') || '无' }}</dd>
            <dt>普通标签</dt><dd>{{ selected.tags.join('、') || '无' }}</dd>
            <dt>紧缚标签</dt><dd>{{ selected.bondageTags.join('、') || '无' }}</dd>
            <dt>应用节点</dt><dd>{{ selected.usedByLabels?.join('、') || '尚未使用' }}</dd>
            <dt>备注</dt><dd>{{ selected.notes || '无' }}</dd>
          </dl>
        </article>
        <p v-else class="empty">请选择一个情节条目。</p>
      </GameScrollArea>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { findPlotEntries, getPlotBondageTagOptions, getPlotTagOptions, getPlotWorldBiasOptions } from '../../../data/plot_outline/plotOutline.js'
import GameScrollArea from './GameScrollArea.vue'

const props = defineProps({ catalog: { type: Object, required: true } })
const keyword = ref('')
const usage = ref('all')
const worldBias = ref('all')
const tag = ref('all')
const bondageTag = ref('all')
const selectedGroupId = ref(props.catalog.groups[0]?.id ?? '')
const selectedId = ref(props.catalog.entries[0]?.id ?? '')
const worlds = computed(() => getPlotWorldBiasOptions(props.catalog))
const tags = computed(() => getPlotTagOptions(props.catalog))
const bondageTags = computed(() => getPlotBondageTagOptions(props.catalog))
const entries = computed(() => findPlotEntries(props.catalog, {
  keyword: keyword.value,
  usage: usage.value,
  worldBias: worldBias.value,
  tag: tag.value,
  bondageTag: bondageTag.value
}))
const visibleGroups = computed(() => props.catalog.groups.filter((group) => entries.value.some((entry) => entry.groupId === group.id)))
const groupEntries = computed(() => entries.value.filter((entry) => entry.groupId === selectedGroupId.value))
const selected = computed(() => groupEntries.value.find((entry) => entry.id === selectedId.value) ?? groupEntries.value[0] ?? null)
watch(visibleGroups, (value) => {
  if (!value.some((group) => group.id === selectedGroupId.value)) selectedGroupId.value = value[0]?.id ?? ''
})
watch(groupEntries, (value) => {
  if (!value.some((entry) => entry.id === selectedId.value)) selectedId.value = value[0]?.id ?? ''
})
function groupEntryCount(groupId) { return entries.value.filter((entry) => entry.groupId === groupId).length }
function usageLabel(entry) { return entry.usageStatus === 'partial' ? '部分使用' : entry.isUsed ? '已使用' : '未使用' }
</script>

<style scoped>
.plot-panel{height:100%;min-height:0;display:flex;flex-direction:column;gap:12px;color:#eadfc8}.toolbar{display:flex;gap:10px;align-items:end;flex-wrap:wrap}.toolbar label{display:grid;gap:4px;color:#baa98a;font-size:12px}.toolbar input,.toolbar select{min-height:34px;border:1px solid #695d49;border-radius:4px;background:#211d19;color:#eadfc8;padding:6px 9px}.toolbar input{width:min(280px,70vw)}.count{margin-left:auto;padding-bottom:8px;color:#9d8d71;font-size:12px}.browser{min-height:0;flex:1;display:grid;grid-template-columns:minmax(190px,24%) minmax(230px,30%) 1fr;gap:12px}.group-list,.entry-list,.detail{min-height:0;border:1px solid #514838;border-radius:5px;background:rgba(24,21,18,.76)}.group-list h3,.entry-list h3{position:sticky;top:0;z-index:1;margin:0;border-bottom:1px solid #514838;background:#211d19;padding:10px 12px;color:#baa98a;font-size:12px;letter-spacing:.12em}.group-list button,.entry-list button{width:100%;border:0;border-bottom:1px solid #40382d;background:transparent;color:#cfc1a6;padding:11px;text-align:left;cursor:pointer}.group-list button{display:grid;grid-template-columns:1fr auto;gap:5px 8px}.group-list button span{grid-column:1/-1;color:#8f826e;font-size:11px;line-height:1.45}.entry-list button{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center}.group-list button:hover,.group-list button.active,.entry-list button:hover,.entry-list button.active{background:#393126;color:#fff2d4}.entry-list span,.group-list small,.entry-list small,header span,header small{color:#99876a;font-size:11px}.detail article{padding:18px 20px 28px}.detail header{display:flex;align-items:baseline;gap:10px;border-bottom:1px solid #514838}.detail h3{margin:0 0 12px;flex:1;color:#f0dcae}.detail p{line-height:1.8}.detail dl{display:grid;grid-template-columns:76px 1fr;gap:10px;margin-top:20px}.detail dt{color:#ae9c7e}.detail dd{margin:0;line-height:1.6}.development{margin-top:18px;padding:14px 16px;border:1px solid #514838;border-radius:5px;background:rgba(57,49,38,.45)}.development h4{margin:0;color:#d9c294}.development dl{margin-top:12px;grid-template-columns:72px 1fr}.empty{padding:18px;color:#988a72}@media(max-width:900px){.browser{grid-template-columns:1fr;grid-template-rows:minmax(140px,25%) minmax(160px,30%) minmax(240px,1fr)}.count{margin-left:0}}
</style>

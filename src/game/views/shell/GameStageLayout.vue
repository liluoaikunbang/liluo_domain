<template>
  <div class="game-stage-layout">
    <aside class="game-stage-layout__panel game-stage-layout__panel--left" aria-label="角色立绘区域">
      <slot name="left"></slot>
    </aside>

    <main class="game-stage-layout__center" aria-label="地图区域">
      <slot name="center"></slot>
    </main>

    <aside class="game-stage-layout__panel game-stage-layout__panel--right" aria-label="地图信息区域">
      <slot name="right"></slot>
    </aside>

    <slot name="overlay"></slot>
  </div>
</template>

<style scoped>
.game-stage-layout {
  position: relative;
  width: min(96vw, calc(96vh * 20 / 9));
  aspect-ratio: 20 / 9;
  display: grid;
  grid-template-columns: 11fr 18fr 11fr;
  align-items: stretch;
  border: 2px solid rgba(225, 129, 215, 0.62);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  background: rgba(34, 16, 39, 0.9);
}

.game-stage-layout__panel {
  min-width: 0;
  min-height: 0;
}

.game-stage-layout__center {
  position: relative;
  min-width: 0;
  min-height: 0;
}
</style>
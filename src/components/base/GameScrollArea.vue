<template>
  <div class="game-scroll-area">
    <slot />
  </div>
</template>

<style scoped>
.game-scroll-area {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: rgba(232, 142, 224, 0.78) rgba(32, 15, 39, 0.62);
}

.game-scroll-area::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.game-scroll-area::-webkit-scrollbar-track {
  border-left: 1px solid rgba(238, 154, 229, 0.14);
  background:
    linear-gradient(180deg, rgba(39, 17, 46, 0.72), rgba(20, 10, 27, 0.72));
}

.game-scroll-area::-webkit-scrollbar-thumb {
  min-height: 34px;
  border: 2px solid rgba(30, 13, 37, 0.9);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(242, 163, 235, 0.95), rgba(173, 75, 154, 0.94));
  box-shadow:
    inset 0 1px 0 rgba(255, 232, 252, 0.36),
    0 0 8px rgba(224, 112, 213, 0.2);
}

.game-scroll-area::-webkit-scrollbar-thumb:hover {
  background:
    linear-gradient(180deg, rgba(255, 190, 249, 0.98), rgba(198, 92, 178, 0.98));
}

.game-scroll-area::-webkit-scrollbar-corner {
  background: rgba(20, 10, 27, 0.72);
}
</style>

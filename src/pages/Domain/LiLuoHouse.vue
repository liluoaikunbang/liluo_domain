<template>
    <!-- 璃落的小屋 -->
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <LiButton class="default-button" @click="store_others.current_story = 0; store_others.backup_link = null; $router.push('read_page')">进入书房（切换为阅读模式）</LiButton><br>
            <LiButton class="default-button" @click="store.enterPlace(step, 'domain')">走出房门（在缚神领地逛逛）</LiButton><br>
            <LiButton class="default-button" @click="store.enterPlace(step, 'empire')">传送水晶（穆妮卡紧缚帝国）</LiButton>
            <br><br><br>
            <a-tabs default-active-key="1" position="left">
                <a-tab-pane key="1" title="房间">
                    <div class="index-button-box">
                        <LiButton class="default-button" @click="store.enterPlace(step, 'liluo')">{{ title_base.liluo.main.title }}</LiButton>
                        <LiButton class="default-button" @click="store.enterPlace(step, 'darkroom')">神秘的暗室</LiButton>
                        <LiButton class="default-button" @click="store.enterPlace(step, 'mumu')">{{ title_base.mumu.main.title }}</LiButton>
                        <LiButton class="default-button" @click="store.enterPlace(step, 'lixue')">{{ title_base.lixue.main.title }}</LiButton>
                    </div>
                </a-tab-pane>
                <a-tab-pane key="2" title="游戏">
                    <div class="index-button-box">
                        <LiButton class="default-button" @click="store.enterPlace(step, 'story')">讲个故事吧</LiButton>
                    </div>
                </a-tab-pane>
            </a-tabs>
            <LiButton class="return-button" @click="$router.push('home')">游戏主菜单</LiButton>
        </template>
        <template #right>
        </template>
    </DomainLayout>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { useUsersStore, useOtherStore } from "@/store/store"

    const store = useUsersStore()
    const store_others = useOtherStore()

    const step = ref(store.game_step)
    const title_base = store.game_step

</script>

<style scoped>
    .index-button-box {
        display: flex;
        flex-direction: column;
    }
    :deep(.arco-tabs-tab-title) {
        color: white;
        font-size: 18px;
    }
</style>



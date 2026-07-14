<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <a-collapse accordion>
                <a-collapse-item header="姐妹日常" key="1">
                    <LiButton v-for="item in mumu_text.sisters" :key="item" class="default-button" @click="enterStoryLink(item)">{{ item.title }}</LiButton>
                </a-collapse-item>
                <a-collapse-item header="璃谱直播间" key="2">
                    <LiButton v-for="item in mumu_text.streamer" :key="item" class="default-button" @click="enterStoryLink(item)">{{ item.title }}</LiButton>
                </a-collapse-item>
                <a-collapse-item header="平行世界" key="3">
                    <LiButton v-for="item in mumu_text.others" :key="item" class="default-button" @click="enterStoryLink(item)">{{ item.title }}</LiButton>
                </a-collapse-item>
            </a-collapse>
        </template>
        <template #right>
            <p>虽然名义上叫牢房，但这里实际上是沐沐的卧室啦。</p>
            <p>在这里可以翻看沐沐与璃落的故事。</p>
            <p>(PS:姐妹日常系列属于早期作品，黑历史警告…………)</p>
        </template>
    </DomainLayout>

</template>

<script setup>
    import { mumu_text } from '@/assets/TextualData.js'
    import { useUsersStore, useOtherStore } from '@/store/store'
    import { enterStoryLink } from '@/utils'

    const store = useUsersStore()
    const store_others = useOtherStore()
    const step = ref(store.game_step.mumu)

</script>

<style scoped>
</style>

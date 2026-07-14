<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <h3>神秘商人的奇物售货日志（作者：夕染）</h3>
            <a-collapse accordion>
                <a-collapse-item key="1" header="第一章：绅淘遇险记">
                    <template v-for="item in smoke_text.mystery_merchant" :key="item">
                        <LiButton class="default-button" @click="enterStoryLink(item)">{{ item.title }}</LiButton><br>
                    </template>
                </a-collapse-item>
            </a-collapse>
        </template>
        <template #right>
        </template>
    </DomainLayout>

</template>

<script setup>
    import { useUsersStore } from '@/store/store'
    import { smoke_text } from '@/assets/TextualData'
    import { enterStoryLink } from '@/utils'

    const store = useUsersStore()
    const step = ref(store.game_step.empire.smoke)
    const story = ref()

</script>

<style scoped>
</style>




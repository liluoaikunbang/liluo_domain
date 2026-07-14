<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <LiButton class="default-button" @click="store.enterPlace(step, 'lust')">{{ title_base.lust.main.title }}</LiButton>
            <LiButton class="default-button" @click="store.enterPlace(step, 'prison')">{{ title_base.prison.main.title }}</LiButton>
        </template>
        <template #right>
        </template>
    </DomainLayout>
</template>

<script setup>
    import { useUsersStore, useOtherStore } from '@/store/store'
    import { splitString } from '@/utils'

    const store = useUsersStore()
    const store_others = useOtherStore()
    const step = ref(store.game_step.empire.wilderness)
    const title_base = store.game_step.empire.wilderness
</script>

<style scoped>
</style>

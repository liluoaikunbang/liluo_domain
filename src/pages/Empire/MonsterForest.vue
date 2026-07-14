<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <LiButton class="default-button" @click="store.enterPlace(step, 'monster_dictionary')">魔物介绍指南</LiButton><br>
            <LiButton class="default-button" @click="store.enterPlace(step, 'shrine')">蜘蛛神社</LiButton><br>
        </template>
        <template #right>
        </template>
    </DomainLayout>

</template>

<script setup>
    import { useUsersStore } from '@/store/store'
    import { enterStoryLink } from '@/utils'

    const store = useUsersStore()
    const step = ref(store.game_step.empire.monster_forest)
    const story = ref()

</script>

<style scoped>
</style>




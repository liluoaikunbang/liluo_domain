<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <LiButton class="default-button" @click="store.enterPlace(step, 'festival')">温泉节活动</LiButton><br>
        </template>
        <template #right>
        </template>
    </DomainLayout>

</template>

<script setup>
    import { useUsersStore } from '@/store/store'

    const store = useUsersStore()
    const step = ref(store.game_step.empire.springs)

</script>

<style scoped>
</style>




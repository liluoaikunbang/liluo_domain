<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <LiButton class="default-button"  @click="store.enterPlace(step, 'pub')">惊喜小酒馆</LiButton>
        </template>
        <template #right>
        </template>
    </DomainLayout>
</template>

<script setup>
    import { useUsersStore } from '@/store/store'

    const store = useUsersStore()
    const step = ref(store.game_step.domain.gourmet_palace)

</script>

<style scoped>
</style>




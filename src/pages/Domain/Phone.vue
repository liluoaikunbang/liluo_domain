<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <LiButton class="default-button" @click="store.enterPlace(step, 'adventure')">冒险邮件箱</LiButton><br>
            <LiButton class="default-button" @click="store.enterPlace(step, 'forum')">璃谱论坛</LiButton><br>
        </template>
        <template #right>
        </template>
    </DomainLayout>
    
</template>

<script setup>
    import { useUsersStore } from '@/store/store'

    const store = useUsersStore()
    const step = ref(store.game_step.domain.phone)

</script>

<style scoped>
</style>




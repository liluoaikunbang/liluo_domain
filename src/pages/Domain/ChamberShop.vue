<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <LiButton class="default-button" @click="store.enterPlace(step, 'chamber1')">十三号病院</LiButton><br>
            <LiButton class="default-button" @click="store.enterPlace(step, 'chamber2')">小女孩家中的惨案</LiButton><br>
            <LiButton class="default-button" @click="store.enterPlace(step, 'chamber3')">别墅美女失踪事件</LiButton><br>
        </template>
        <template #right>
        </template>
    </DomainLayout>

</template>

<script setup>
    import { useUsersStore } from '@/store/store'

    const store = useUsersStore()
    const step = ref(store.game_step.domain.chamber_shop)
</script>

<style scoped>
    :deep(.arco-tabs-tab-title) {
        color: white;
        font-size: 18px;
    }
</style>

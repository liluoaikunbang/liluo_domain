<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <h3>主演</h3>
            <div v-for="(item, index) in cinema_text" :key="index">
                <LiButton class="default-button" @click="enterStoryLink(item)">{{ item.title }}</LiButton><br>
            </div>
        </template>
        <template #right>
        </template>
    </DomainLayout>
</template>

<script setup>
    import { cinema_text } from '@/assets/TextualData'
    import { useUsersStore } from '@/store/store'
    import { enterStoryLink } from '@/utils'

    const store = useUsersStore()
    const step = ref(store.game_step.domain.cinema)

</script>

<style scoped>
</style>




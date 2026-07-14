<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <LiButton class="default-button" v-for="item in springs_text.new_year_2024" :key="item" @click="enterStoryLink(item)">{{ item.title }}({{ item.author }})</LiButton>
        </template>
        <template #right>
        </template>
    </DomainLayout>

</template>

<script setup>
    import { useUsersStore } from '@/store/store'
    import { springs_text } from '@/assets/TextualData'
    import { enterStoryLink } from '@/utils'

    const store = useUsersStore()
    const step = ref(store.game_step.empire.springs.festival)
    const story = ref()

</script>

<style scoped>
</style>




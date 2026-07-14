<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <LiButton class="default-button" @click="enterStoryLink(jiuer_text.stories[0])">查看笔记</LiButton><br>
            <LiButton class="default-button" @click="enterStoryLink(jiuer_text.letters[0])">查看信件</LiButton><br>
        </template>
        <template #right>
        </template>
    </DomainLayout>
</template>

<script setup>
    import { useUsersStore } from '@/store/store'
    import { jiuer_text } from '@/assets/TextualData'
    import { enterStoryLink } from '@/utils'

    const store = useUsersStore()
    const step = ref(store.game_step.domain.jiuer.liluo)
    const story = ref()

</script>

<style scoped>
</style>




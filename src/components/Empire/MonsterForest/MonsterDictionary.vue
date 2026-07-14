<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <LiButton class="default-button" v-for="item in monster_dictionary_text" :key="item" @click="step.main.step = 'content'; content_item = item ">{{ item.title }}</LiButton><br>
        </template>
        <template #right>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'content'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'start' ">其他魔物资料</LiButton><br>
        </template>
        <template #right>
            <h3>{{ content_item.title }}</h3>
            <h3 v-if="content_item.author">作者：{{ content_item.author }}</h3>
            <p v-for="section in splitString(content_item.content)" :key="section">{{ section }}</p>
        </template>
    </DomainLayout>

</template>

<script setup>
    import { useUsersStore, useOtherStore } from '@/store/store'
    import { monster_dictionary_text } from '@/assets/TextualData'
    import { enterStoryLink, splitString } from '@/utils'

    const store = useUsersStore()
    const store_others = useOtherStore()
    const step = ref(store.game_step.empire.monster_forest.monster_dictionary)

    const content_item = ref()

</script>

<style scoped>
</style>




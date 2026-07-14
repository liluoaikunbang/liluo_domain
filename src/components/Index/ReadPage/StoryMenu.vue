<template>
    <template v-for="item in all_stories" :key="item">
        <p :class="`title-${item.level}`">
            {{ item.name }}
            <LiButton class="default-button" v-if="item.path" @click="clickJump(item.path)">跳转</LiButton>
        </p>
        <template v-if="item.content">
            <a-collapse accordion>
                <a-collapse-item header="小说目录" key="1">
                    <LiButton class="default-button" v-for="story in item.content" :key="story" @click="store_others.current_story = story; scrollWindow('top') ">{{ story.title }}</LiButton>
                </a-collapse-item>
            </a-collapse>
        </template>
    </template>
</template>

<script setup>
    import { all_stories } from '@/assets/TextualData'
    import { useUsersStore, useOtherStore } from '@/store/store'
    import { scrollWindow, clickJump } from '@/utils'

    const store = useUsersStore()
    const store_others = useOtherStore()

</script>

<style scoped>
    .title-1 {
        font-size: 30px;
        color: white;
        text-indent: 0em;
    }
    .title-2 {
        font-size: 27px;
        color: white;
        text-indent: 1em;
    }
    .title-3 {
        font-size: 24px;
        color: white;
        text-indent: 2em;
    }
    .title-4 {
        font-size: 20px;
        color: white;
        text-indent: 3em;
    }
</style>




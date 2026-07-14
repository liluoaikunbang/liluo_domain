<template>
    <template v-if="story.foreword">
        <p v-for="section in splitString(story.foreword)" :key="section">
            <LiText :text="section" />
        </p>
    </template>
    <h3>{{ story.title }}</h3>
    <h3 v-if="story.author">作者：{{ story.author }}</h3>
    <h3 v-if="story.premiere"><a @click="copy(story.premiere.link)">首发位置：{{ story.premiere.title }}(点击可复制链接)</a></h3>
    <LiButton v-if="!router.currentRoute.value.fullPath.includes('read_page') && !no_read_page" @click="clickReadMode()">阅读模式</LiButton>
    <div v-if="story.split">
        <div v-for="subsection in story.content" :key="subsection">
            <h3>{{ subsection.title }}</h3>
            <p v-for="section in splitString(subsection.content)" :key="section">
                <LiText :text="section" />
            </p>
        </div>
    </div>
    <div v-else>
        <p v-for="section in splitString(story.content)" :key="section">
            <LiText :text="section" />
        </p>
    </div>
</template>

<script>
import { splitString } from '@/utils'
import useClipboard from 'vue-clipboard3'
import LiButton from './LiButton.vue'
import { useUsersStore, useOtherStore } from '@/store/store'
import router from '@/router'
export default {
    components: {
        LiButton,
    },
    props: ['story', 'no_read_page'],
    setup(props) {

        const store = useUsersStore()
        const store_others = useOtherStore()

        const copy = (link) => {
            const { toClipboard } = useClipboard()
            toClipboard(link)
            console.log('链接复制成功')
        }

        const clickReadMode = () => {
            store_others.current_story = props.story
            store_others.backup_link = router.currentRoute.value.fullPath
            router.push({
                path: `/read_page`
            })
        }

        return {
            store, store_others, router,
            copy,
            splitString,
            clickReadMode,
        }
    }
}
</script>

<style scoped>
</style>



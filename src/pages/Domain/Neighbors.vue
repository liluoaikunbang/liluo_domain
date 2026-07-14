<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <h3>翻看故事</h3>
            <LiButton class="default-button" @click="step.main.step = 'stories'">翻看领地小故事</LiButton>

            <h3>查看人设</h3>
            <a-tabs default-active-key="神之使小区" position="left">
                <a-tab-pane v-for="community in all_community" :key="community" :title="community">
                    <div class="neighbor-button-box">
                        <LiButton class="default-button" v-for="item in neighbors_text.persons" :key="item" 
                            v-show="item.type == community" @click="step.main.step = item.name; selectStories(item.name)">{{ item.name }}</LiButton>
                    </div>
                </a-tab-pane>
            </a-tabs>
        </template>
        <template #right>
            <p>璃落的小别墅周围还建满了其他领地住户的房子。虽然很多人不常住在这里，但领地会为每一位居民留下属于自己的私人空间。</p>
            <p>注：人设详情的下方也会列出对应住户的所有相关故事。</p>
        </template>
    </DomainLayout>

    <!-- 翻看领地小故事 -->
    <DomainLayout v-if="step.main.step == 'stories'">
        <template #left>
            <h3>故事人物</h3>
            <LiButton class="default-button" v-for="item in all_neighbors" :key="item" @click="selectStories(item)">{{ item }}</LiButton>
        </template>
        <template #right>
            <p>注：因为领地小故事较多，在这里根据主角对故事进行分类，请点击人物按钮来选择故事选集。</p>
            <h3>故事选集</h3>
            <div v-if="stories">
                <LiButton class="default-button" v-for="item in stories" :key="item" @click="enterStoryLink(item)">{{ item.title }}</LiButton>
            </div>
        </template>
    </DomainLayout>

    <!-- 个人人设展示 -->
    <template v-for="item in neighbors_text.persons" :key="item">
        <DomainLayout v-if="step.main.step == item.name">
            <template #left>
                <div v-if="all_neighbors.includes(item.name)">
                    <h3>与她相关的故事</h3>
                    <LiButton class="default-button" v-for="story in stories" :key="story" @click="enterStoryLink(story)">{{ story.title }}</LiButton>
                </div>
            </template>
            <template #right>
                <p>你来到了{{ item.name }}的房子，ta的人设如下：</p>
                <p v-for="section in splitString(item.settings)" :key="section">{{ section }}</p>
            </template>
        </DomainLayout>
    </template>

</template>

<script setup>
    import lodash from 'lodash'
    import { neighbors_text } from '@/assets/TextualData'
    import { splitString, scrollWindow } from '@/utils.js'
    import { useUsersStore } from '@/store/store'
    import { enterStoryLink } from '@/utils'

    const store = useUsersStore()
    const step = ref(store.game_step.domain.neighbors)
    const sub_step = ref() // 判断从哪里进入的详细故事界面，方便回退时去往对应位置
    const detail = ref(false)

    // 将小故事中所有角色变成一个列表方便取用
    let all_neighbors = []
    for(let i = 0; i < neighbors_text.stories.length; i++){
        all_neighbors = lodash.concat(all_neighbors, neighbors_text.stories[i].roles)
    }
    all_neighbors = lodash.union(all_neighbors)

    // 根据人物筛选出出现过该人物的故事集
    const stories = ref([])
    const selectStories = (role) => {
        stories.value = [] // 首先清空之前选中的故事集
        for(let i = 0; i < neighbors_text.stories.length; i++){
            if(neighbors_text.stories[i].roles.includes(role)){ stories.value.push(neighbors_text.stories[i]) }
        }
        return stories
    }

    // 将角色中的所有小区变成一个列表方便取用
    let all_community = lodash.union(neighbors_text.persons.map((item) => { return item.type }))

</script>

<style scoped>
    .neighbor-button-box {
        display: flex;
        flex-direction: column
    }
    :deep(.arco-tabs-tab-title) {
        color: white;
        font-size: 18px;
    }
</style>




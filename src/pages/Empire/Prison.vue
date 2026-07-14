<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <h3>档案</h3>
            <a-collapse accordion>
                <a-collapse-item header="笔记">
                    <p>笔记中记录了璃落与深渊幽狱相关的故事，其中大都与案件无关。</p><br>
                    <div v-for="item in prison_text.notes" :key="item">
                        <LiButton class="default-button" @click="enterStoryLink(item)">{{ item.title }}</LiButton><br>
                    </div>
                </a-collapse-item>
            </a-collapse>
            <a-collapse accordion>
                <a-collapse-item header="狱典">
                    <p>狱典中记录了所有在押的犯人，璃落可在其中选择犯人进行提审和拷问。</p><br>
                    <div v-for="person in prison_text.persons.filter(item => {return item.stories.length || item.cases.length})" :key="person">
                        <LiButton class="default-button" @click="step.main.step = 'person'; init(); person_item = person ">{{ person.name }}</LiButton><br>
                    </div>
                    <p>注：暂无翻阅以下犯人的审讯笔记、案件复盘的权限。</p>
                    <div v-for="person in prison_text.persons.filter(item => {return !item.stories.length && !item.cases.length})" :key="person">
                        <LiButton class="default-button" @click="step.main.step = 'person'; init(); person_item = person">{{ person.name }}</LiButton><br>
                    </div>
                </a-collapse-item>
            </a-collapse>
            <a-collapse accordion>
                <a-collapse-item header="卷宗">
                    <p>卷宗中记录了部分目前犯人尚未归案或尚无审问权利的案件，虽见不到犯人，璃落仍可以通过这些卷宗查看案件情况。</p><br>
                    <div v-for="item in prison_text.dossier" :key="item">
                        <LiButton class="default-button" @click="enterStoryLink(item)">{{ item.title }}</LiButton><br>
                    </div>
                </a-collapse-item>
            </a-collapse>
            <!-- <h3>介绍</h3>
            <a-collapse accordion>
                <a-collapse-item header="监狱介绍">
                    <LiButton class="default-button" @click="store.enterPlace(step, item.title, item.title)">{{ item.title }}</LiButton><br>
                </a-collapse-item>
            </a-collapse> -->
        </template>
        <template #right>
        </template>
    </DomainLayout>

    <!-- 狱典 -->
    <template v-if="step.main.step == 'person'">
        <DomainLayout>
            <template #left>
                <div v-if="person_step == 'start'">
                    <div v-if="person_item.stories.length">
                        <h3>审讯笔记</h3>
                        <LiButton class="default-button" v-for="item in person_item.stories" :key="item" 
                            @click="person_step = 'story'; person_story = item">
                            {{ item.title }}</LiButton><br>
                    </div><br>
                    <div v-if="person_item.cases.length">
                        <h3>案件复盘</h3>
                    </div>
                </div>
                <LiButton class="default-button" v-if="person_step != 'start'" @click="person_step = 'start'">返回犯人界面</LiButton>
                <LiButton class="default-button" v-else @click="step.main.step = 'start'">查看其他档案</LiButton>
            </template>
            <template #right>
                <div v-if="person_step == 'start'">
                    <h3>犯人：{{ person_item.name }}</h3>
                    <h3>犯人信息</h3><br>
                    <DisplayImage v-if="person_item.images" :images="person_item.images" />
                    <p v-for="section in splitString(person_item.content)" :key="section">{{ section }}</p>
                </div><br>

                <!-- 审讯笔记 -->
                <div v-if="person_step == 'story'">
                    <DisplayStory :story="person_story" />
                </div>
            </template>
        </DomainLayout>
    </template>

</template>

<script setup>
    import { useUsersStore, useOtherStore } from '@/store/store'
    import { prison_text } from '@/assets/TextualData'
    import { splitString, scrollWindow, enterStoryLink } from '@/utils'

    const store = useUsersStore()
    const store_others = useOtherStore()
    const step = ref(store.game_step.empire.wilderness.prison)
    const story = ref()
    const person_item = ref()
    const person_step = ref('start')
    const person_story = ref()

    const init = () => {
        person_step.value = 'start'
        person_story.value = null
    }

</script>

<style scoped>
</style>




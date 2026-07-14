<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <a-tabs default-active-key="1" position="left">
                <a-tab-pane key="1" title="官方文件集">
                    <div class="house-button-box">
                        <LiButton class="default-button" @click="store.enterPlace(step, 'settings')">领地设定集</LiButton>
                    </div>
                </a-tab-pane>
                <a-tab-pane key="2" title="领地大事记">
                    <div class="house-button-box">
                        <LiButton class="default-button" @click="step.main.step = 'new_year'; story = church_text.new_year_2022[0].title">新年捆绑接龙事件</LiButton>
                        <LiButton class="default-button" @click="enterStoryLink(church_text.saint_story[0])">紧缚圣女加冕事件</LiButton>
                    </div>
                </a-tab-pane>
                <a-tab-pane key="3" title="任务领取处">
                    <div class="house-button-box">
                        <LiButton class="default-button" @click="store.enterPlace(step, 'kidnapper')">论如何气晕绑匪</LiButton>
                    </div>
                </a-tab-pane>
            </a-tabs>
        </template>
        <template #right>
        </template>
    </DomainLayout>
    <template v-for="(item, index) in church_text.new_year_2022" :key="index">
        <DomainLayout v-if="step.main.step == 'new_year' && story == item.title">
            <template #left>
                <LiButton class="default-button" @click="nextAlternation()">下一位</LiButton><br><br>
                <LiButton class="default-button" @click="step.main.step = 'start'; story = church_text.new_year_2022[0].title">返回缚神殿</LiButton>
            </template>
            <template #right>
                <p>发生于缚神历1012年新年时期的捆绑接龙事件，开端于沐沐捆璃落，并最终形成循环，达成全员被绑的成就。</p>
                <h3>{{ '(' + (index + 1) + '/' + church_text.new_year_2022.length + ')' + item.title }}</h3>
                <p v-for="section in splitString(item.content)" :key="section">{{ section }}</p>
            </template>
        </DomainLayout>
    </template>

</template>

<script setup>
    import { church_text } from '@/assets/TextualData'
    import { splitString, enterStoryLink } from '@/utils'
    import { useUsersStore } from '@/store/store'

    const store = useUsersStore()
    const step = ref(store.game_step.domain.church)

    // 捆绑接龙
    const story = ref('') // 用于标记捆绑接龙中当前的具体故事
    const nextAlternation = () => { // 翻看捆绑接龙中的下一个受害者，因为接龙为环状因此要注意从最后一个跳到第一个
        for(let i = 0; i < church_text.new_year_2022.length; i++){
            if(church_text.new_year_2022[i].title == story.value){
                if(i == church_text.new_year_2022.length - 1){ story.value = church_text.new_year_2022[0].title }
                else{ story.value = church_text.new_year_2022[i + 1].title }
                return
            }
        }
    }

</script>

<style scoped>
    :deep(.arco-tabs-tab-title) {
        color: white;
        font-size: 18px;
    }
</style>




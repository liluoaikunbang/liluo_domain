<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <LiButton class="default-button" @click="store.enterPlace(step, 'visiting', '参观笨笨之家')">参观笨笨之家</LiButton>

            <h3>在大厅逛逛</h3>
            <a-tabs default-active-key="1" position="left" class="bottom-box">
                <a-tab-pane key="1" title="和人偶闲聊">
                    <LiButton class="default-button" @click="step.main.step = 'talk1' ">笨璃璃的来历</LiButton>
                </a-tab-pane>
                <a-tab-pane key="2" title="看望笨璃璃">
                    <LiButton class="default-button" v-for="item in stupid_house_text.li" :key="item" @click="step.main.step = 'lili'; lili = item">{{ item.name }}</LiButton>
                </a-tab-pane>
                <a-tab-pane key="3" title="看望笨落落">
                    <LiButton class="default-button" v-for="item in stupid_house_text.luo" :key="item" @click="step.main.step = 'lili'; lili = item">{{ item.name }}</LiButton>
                </a-tab-pane>
                <a-tab-pane key="4" title="世界扭蛋机">
                    <LiButton class="default-button" v-for="item in stupid_house_text.others" :key="item" @click="enterStoryLink(item)">{{ item.title }}</LiButton>
                </a-tab-pane>
            </a-tabs>
        </template>
        <template #right>
        </template>
    </DomainLayout>

    <template v-if="step.main.step == 'lili'">
        <DomainLayout>
            <template #left>
                <LiButton class="default-button" @click="step.main.step = 'start' ">继续探索笨笨之家</LiButton>
            </template>
            <template #right>
                <h2>{{ lili.name }}</h2>
                <p>{{ lili.intro }}</p>
                <DisplayImage v-if="lili.image" :images="lili.image" />
                <p>正在查看{{ lili.name }}近况……</p>
                <DisplayStory :story="lili.content" />
            </template>
        </DomainLayout>
    </template>


    <!-- 闲聊 -->
    <DomainLayout v-if="step.main.step == 'talk1'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'start' ">继续探索笨笨之家</LiButton>
        </template>
        <template #right>
            <p v-for="section in splitString(talk_notes[0].content)" :key="section">{{ section }}</p>
        </template>
    </DomainLayout>
</template>

<script setup>
    import { stupid_house_text } from '@/assets/TextualData.js'
    import { splitString, enterStoryLink } from '@/utils'
    import { useUsersStore, useOtherStore } from '@/store/store'

    const store = useUsersStore()
    const store_others = useOtherStore()
    const step = ref(store.game_step.domain.stupid_house)
    const lili = ref()
    const story = ref()

    const talk_notes = [
        {
            content: `
                “滴~以读取问题，正在调取多多的录音……”
                “她们是璃落在某一时刻的不同可能，换句话说，就是其他平行世界的璃落，因此性格和长相都会和璃落有些许不同，我将她们统一称为笨璃璃（偏M）或笨落落（偏S），你可以简单的将她们理解为你的分身。”
                “当然，为了不影响其他世界的平衡，我只会在她们在那方世界她们死亡的前一秒进行召唤，并将她们的身体转换为刚刚成年时的状态。”
                “为防止召唤过程中的意外，来到领地的笨璃璃（落落）们之前的记忆会被暂时封印，直到她们在笨笨之家完成这方世界的常识性教育后，才可以选择是否解开自己上一世的记忆，并自行选择之后的生活。”
            `,
        },
    ]
</script>

<style scoped>
    :deep(.arco-tabs-tab-title) {
        color: white;
        font-size: 18px;
    }

</style>

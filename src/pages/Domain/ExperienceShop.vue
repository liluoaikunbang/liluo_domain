<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <a-tabs default-active-key="1" position="left" class="bottom-box">
                <a-tab-pane key="1" title="体验">
                    <!-- <LiButton class="default-button" @click="clickButton('base', '紧缚逃脱-都市版')">紧缚逃脱-都市版(未完善)</LiButton> -->
                    <LiButton class="default-button">紧缚逃脱-都市版(未完善)</LiButton>
                </a-tab-pane>
                <a-tab-pane key="2" title="闲聊">
                    <LiButton class="default-button" @click="step.main.step = 'talk1'">最近生意怎么样</LiButton>
                    <!-- <LiButton class="default-button" @click="step.step = 'talk2'">有什么新服务呢</LiButton> -->
                </a-tab-pane>
            </a-tabs>
        </template>
        <template #right>
            <p>“好久不见哦璃落~”紧缚体验店的老板娘语嫣欢快地同自己的老顾客寒暄着，“今天要体验什么？”</p>
        </template>
    </DomainLayout>

    <!-- 闲聊 -->
    <DomainLayout v-if="step.main.step == 'talk1'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'start'">看看别处</LiButton>
        </template>
        <template #right>
            <p>“还不错。每天都有不少小M来体验。”语嫣回答道，“毕竟咱们这个地方盛产小M嘛，像我这样的S才稀有呢。”</p>
            <p>“你明明也有M的一面……”璃落在心里吐槽着，当然这话她没敢说出来，今天她不想被迫享受“老板娘的亲自服务”。</p>
        </template>
    </DomainLayout>

    <!-- <div v-if="step.main.step == 'talk2'">
        <p>“之前小璃落给的建议都很棒哦，根据你那些想法，我推出了几种新的拘束体验模式。”在这方面，语嫣小姐总有说不完的话题。</p>
        <p>“之前小璃落体验过不少次的拘束体验现在放到了传统模式里，主要玩法还是选衣服和拘束具然后想办法挣扎逃脱。后来把传统模式
            里的探索和事件元素强化了一下做成了新的模式。”</p>
        <p>“锁铐模式里面你可以选择场景和身上各处的锁具数量，因为都是上锁的束缚嘛，这个模式下不能挣扎，只能通过探索周边环境拿到钥匙来帮助逃脱。”</p>
        <p>“娱乐模式下绑匪就是正经绑架了，不过绑匪小姐姐人不坏，你可以跟她聊聊天，说不定能让她回心转意把你放了呢。”</p>
        <p>“最后的超凡模式就是传统模式的强化版了，你可以选择天赋来强化自己的脱缚能力，但相对的这个模式下的拘束具也都具有超自然力量，可不是那么好逃掉的。”</p>
        <p>“听起来真不错诶。”璃落已经迫不及待要开始体验了。</p>
    </div> -->

</template>

<script setup>
    import { useUsersStore } from '@/store/store'
    import lodash from 'lodash'

    const store = useUsersStore()
    const step = ref(store.game_step.domain.experience_shop)
    const untie_values = lodash.cloneDeep(store.untie_values) // 紧缚体验店中可能修改逃脱能力值，因此先在这里备份一份，组建销毁时被恢复。

    const clickButton = (step_value, step_name) => {
        store.enterPlace(step.value, step_value, step_name)
    }

    onBeforeUnmount(() => { // 组建销毁前的操作
        store.untie_values = lodash.cloneDeep(untie_values) // 将脱缚能力还原回去
    })
</script>

<style scoped>
    :deep(.arco-tabs-tab-title) {
        color: white;
        font-size: 18px;
    }
</style>

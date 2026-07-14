<template>
    <h2>天赋选择</h2>
    <h3>正天赋（减天赋点）</h3>
    <a-select class="gift-select" v-model="positive_value" placeholder="请选择天赋……" multiple @change="getGiftPoint">
        <a-option v-for="item of positive_gifts" :key="item.label" :value="item" :label="item.label" />
    </a-select>
    <h3>负天赋（加天赋点）</h3>
    <a-select class="gift-select" v-model="negative_value" placeholder="请选择天赋……" multiple @change="getGiftPoint">
        <a-option v-for="item of negative_gifts" :key="item.label" :value="item" :label="item.label" />
    </a-select>
    <p>当前天赋点数量为{{ gift_points }}。注意，开始游戏需要天赋点数至少为0</p>
    <LiButton class="shop-button" v-if="gift_points >= 0" @click="startClick1()">确定天赋</LiButton>
    <LiButton class="shop-button" v-else :disabled="true">确定天赋</LiButton>
</template>

<script>
export default {
    setup() {
        // 天赋
        const positive_value = ref(), negative_value = ref() // 已选中的天赋
        const gift_points = ref(0)
        const positive_gifts = [ // 正向天赋列表
            {
                value: 0,
                label: '灵活的舌头',
                intro: '嘴部脱缚能力+3',
                handle() { liluo_data.changeUntie(0, 3, 0, 0, 0) }
            },
            {
                value: 1,
                label: '灵活的手指',
                intro: '手臂脱缚能力+2；手指脱缚能力+3',
                handle() { liluo_data.changeUntie(0, 0, 2, 3, 0) }
            },
            {
                value: 2,
                label: '舞蹈演员',
                intro: '手臂，手指，腿部脱缚能力+3',
                handle() { liluo_data.changeUntie(0, 0, 3, 3, 3) }
            },
            { // 收紧事件概率-5%
                value: 3,
                label: '外表柔弱',
                intro: '收紧事件概率-5%',
                handle() {}
            },
            { // 脱衣事件概率-5%
                value: 4,
                label: '天生傲骨',
                intro: '脱衣事件概率-5%',
                handle() {}
            },
            {
                value: 5,
                label: 'S的尊严',
                intro: '全部脱缚能力+2',
                handle() { liluo_data.changeUntie(2, 2, 2, 2, 2) }
            },
            { // 高潮时体力减少量-10
                value: 6,
                label: '强健体魄',
                intro: '体力+50',
                handle() { liluo_data.vit.value += 50 }
            },
            {
                value: 7,
                label: '倔强灵魂',
                intro: '快感上限+30',
                handle() { liluo_data.pleasure.value.value += 30 }
            },
            { // 脱衣事件概率-3%，收紧事件概率-3%
                value: 8,
                label: '冷静镇定',
                intro: '脱衣事件概率-3%，收紧事件概率-3%，敏感程度-0.1，快感上限+20',
                handle() { liluo_data.sen.value -= 0.1; liluo_data.pleasure.value += 20 }
            },
        ]

        const negative_gifts = [ // 负向天赋列表
            {
                value: 0,
                label: '笨拙的舌头',
                intro: '嘴部脱缚能力-3',
                handle() { liluo_data.changeUntie(0, -3, 0, 0, 0) }
            },
            {
                value: 1,
                label: '笨拙的手指',
                intro: '手臂脱缚能力-2；手指脱缚能力-3',
                handle() { liluo_data.changeUntie(0, 0, -2, -3, 0) }
            },
            {
                value: 2,
                label: '身体僵硬',
                intro: '手臂，手指，腿部脱缚能力-3',
                handle() { liluo_data.changeUntie(0, 0, -3, -3, -3) }
            },
            { // 收紧事件概率+5%
                value: 3,
                label: '天生丽质',
                intro: '收紧事件概率+5%',
                handle() {}
            },
            { // ：脱衣事件概率+5%
                value: 4,
                label: '天生媚骨',
                intro: '脱衣事件概率+5%',
                handle() {}
            },
            {
                value: 5,
                label: 'M的本能',
                intro: '全部脱缚能力-2',
                handle() { liluo_data.changeUntie(-2, -2, -2, -2, -2) }
            },
            { // 高潮时体力减少量+10
                value: 6,
                label: '虚弱宅女',
                intro: '体力-50，高潮时体力减少量+10',
                handle() { liluo_data.vit.value -= 50 }
            },
            {
                value: 7,
                label: '倔强灵魂',
                intro: '快感上限+30',
                handle() { liluo_data.pleasure.value += 30 }
            },
            { // 脱衣事件概率+3%，收紧事件概率+3%
                value: 8,
                label: '饥渴难耐',
                intro: '脱衣事件概率+3%，收紧事件概率+3%，敏感程度+0.1，快感上限-20',
                handle() { liluo_data.sen.value += 0.1; liluo_data.pleasure.value -= 20 }
            },
        ]

        const getGiftPoint = () => { // 计算当前天赋点数量
            if(!positive_value.value && !negative_value.value) { gift_points.value = 0 }
            else if(!positive_value.value && negative_value.value) { gift_points.value = negative_value.value.length - 0 }
            else if(positive_value.value && !negative_value.value) { gift_points.value = 0 - positive_value.value.length }
            else { gift_points.value = negative_value.value.length - positive_value.value.length }
        }

        return {

        }
    },
}
</script>


<style scoped>

</style>







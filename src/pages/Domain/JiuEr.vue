<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <LiButton class="default-button" @click="store.enterPlace(step, 'jiuer')">玖儿的房间</LiButton><br>
            <LiButton class="default-button" @click="store.enterPlace(step, 'liluo')">璃落的房间</LiButton><br>
            <LiButton class="default-button" @click="step.main.step = 'card'">地上的小卡片</LiButton><br>
        </template>
        <template #right>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'card'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'start'">回到客厅</LiButton>
        </template>
        <template #right>
            <p>画外音：不会被剧情中的角色发现的高维卡片，上面记录了房间中两位主人的人设。</p>
            <template v-for="item in persons" :key="item">
                <h3>{{ item.title }}</h3>
                <p v-for="section in splitString(item.content)" :key="section">{{ section }}</p>
                <DisplayImage :images="item.image" />
                <br><br>
            </template>
        </template>
    </DomainLayout>

</template>

<script setup>
    import { useUsersStore, useOtherStore } from '@/store/store'
    import { splitString } from '@/utils';

    const store = useUsersStore()
    const store_others = useOtherStore()
    const step = ref(store.game_step.domain.jiuer)

    const persons = [
        {
            title: '玖儿的人设',
            content: `
                姓名：拉芙希妮（昵称 玖儿）
                种族：红龙后裔（龙娘，可以在人形和龙形态之间转换。）
                年龄：外貌看大约22岁（实际年龄不详，大约是活了很久的样子）
                外貌：金黄色波浪长发，长度大约到肩膀下面一些，喜欢用白色的花朵来作为发簪装饰头发；浅绿色瞳孔，头上有短短的龙角，龙角侧面也有花朵的装饰。常年穿着款式不同的洛丽塔衣装（前短后长的款式），能够看到腿上的镀金花纹黑色丝袜。身高大约175cm，体重55kg。
                性格：为人比较安静，与世无争，然而却对于熟悉的人来说非常粘人，由于幼年的经历，十分渴求得到关爱，并且希望能够和亲近的人发展出更进一步的关系。
            `,
            image: 'Personality_JiuEr',
        },
        {
            title: '艾米的人设',
            content: `
                （画外音：玖儿专属的艾米小姐人设哦）
                姓名：艾米
                身高：155cm
                体重：45kg
                三围：86/58/85
                外貌：白色头发红色瞳孔的猫娘，身形纤细而瘦小，显得双腿格外修长而双足格外小巧精致。
                背景：逐日之民的公主。逐日之民拥有极佳攻击魔法亲和天赋，出生便具有深不可测的魔法储量和魔法恢复速度，能轻松用出普通人一辈子难以企及的高阶破坏魔法，代价身体孱弱，难以躲避任何近身攻击，并且不能使用辅助魔法，在帝国的各个角落作为大魔法师活跃着。在族群之中在15岁只身进行魔法亲和鉴定时，被其他人陷害，中了诅咒陷阱，并被传送到了帝国。由于没有做过鉴定，因此没有完结的帮助无法学会任何魔法，因此现在在玖儿的服装店之中当学徒，而玖儿也在尝试用其余的办法教会艾米更多的法术，目前颇有成效。遭到的诅咒是一件没有正面裙，半透明，没有内衣，露出蜜穴和乳头的婚纱款式，同时绑定白色铃铛项圈，白色丝袜和透明高跟鞋。这件衣服可以轻易地被魔力强于艾米的人掌控，目前正处于被玖儿契约的状态。
                诅咒水晶高跟鞋：作为诅咒婚纱的配套鞋子，在正常时候有7厘米的高度。在将要被施加双足部位的束缚或者玩具时，将会改为增加水晶高跟鞋的高度，或者进行足底刺激，具体刺激方式和增加的高度由性攻击的强度决定。
            `,
            image: 'Personality_AiMi'
        },
    ]
</script>

<style scoped>
</style>




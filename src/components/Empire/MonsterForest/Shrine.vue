<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'yangguang' ">阳光人设</LiButton><br>
            <LiButton class="default-button" @click="store.enterPlace(step, 'photos')">阳光的相册</LiButton><br>
            <br>
            <a-collapse accordion>
                <a-collapse-item key="1" header="阳光的冒（白）险（给）之旅">
                    <LiButton class="default-button" v-for="item in shrine_text" :key="item" @click="enterStoryLink(item)">{{ item.title }}</LiButton><br>
                </a-collapse-item>
            </a-collapse>
        </template>
        <template #right>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'yangguang'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'start' ">返回神社</LiButton><br>
        </template>
        <template #right>
            <DisplayImage :images="store_others.all_images.Personality_YangGuang" />
            <p>姓名：阳光</p>
            <p>性别：女</p>
            <p>年龄：从外貌上看大约20岁（真实年龄不详，似乎活了很久的样子）</p>
            <p>外貌：天蓝色及腰长直发，淡紫色瞳孔的少女，头上有着两个灵动的猫耳，猫耳下方的头发编着两根辫子，一年四季都穿着不同风格的Lolita小裙子，身高165cm，体重55kg，B-80C;W-70;H-88</p>
            <p>喜欢：华丽的小裙子，各种美食</p>
            <p>讨厌：一切不好吃的东西</p>
            <p>性格：平易近人的性格让阳光成为魔女中最“无害”的一员，可内心却跟其他魔女一样心狠手辣，以折磨猎物为乐，同时还有着和猫猫一样旺盛的好奇心，经常被人利用好奇心旺盛这个弱点</p>
            <p>背景：作为隐居于世的魔女之一，本体被人们称为——繁花魔女，因擅长治疗魔法与精通毒物的制作及使用而闻名。</p>
            <p>因为魔女的身份，被王国视为眼中钉，组织了勇者小队讨伐，与勇者大战后失踪。</p>
            <p>大战之后，王国出现了一名医术高超的云游医者，可所有人都回忆不起这名医者的外貌，只记得她有一头漂亮的天蓝色长发……</p>
            <p>武器：镶嵌着华丽宝石的镰刀，刀柄有着缎带与蝴蝶结装饰</p>
            <p>能力：</p>
            <p>【创造分身】消耗所有魔力创造出一个与本体无异的分身，该分身具有自主意识，本体可远程操控该分身，并共享该分身的所有感官</p>
            <p>【魔女的凝视】作为一名魔女，对一切生物拥有血脉上的压制，在被阳光凝视时都会本能的察觉到恐惧。</p>
            <p>【魔力亲和】对魔力与魔法都有着自己独到的见解，能对一切法术进行解析，并且能轻易感知空气中魔力的流动。</p>
            <p>【药剂精通】擅长制作药剂，并且可以使药剂的效果得到最大程度的发挥。</p>
        </template>
    </DomainLayout>

</template>

<script setup>
    import { useUsersStore, useOtherStore } from '@/store/store'
    import { shrine_text } from '@/assets/TextualData'
    import { enterStoryLink } from '@/utils'

    const store = useUsersStore()
    const store_others = useOtherStore()
    const step = ref(store.game_step.empire.monster_forest.shrine)

</script>

<style scoped>
</style>




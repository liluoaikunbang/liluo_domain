<template>
    <Base :step="step" :return_name="'其他实体档案'" >
        <template #start_left>
            <LiButton class="default-button" v-for="item in darkroom_text.enemies" :key="item" @click="store_others.darkroom_item = item ">{{ item.name }}</LiButton>
        </template>
        <template #start_right>
            <p>实体为“囚笼”空间中的独有个体，一般用来泛指除了流浪者之外的其余生物。由于在此处凡事皆不能用常理来猜测，因此并不能够用“生物”的普遍标准来揣测实体的属性，亦或者某个东西是否真的是实体。</p>
            <p>根据已有调查，互助会猜测“囚笼”中的实体均为或曾经为进入后室的流浪者因“囚笼”中的特殊法则恶堕而成，但恶堕后的实体打都已经失去理智，虽然仍有少量可以沟通的人形实体存在，但互助会已无法通过送回普通流浪者的手段帮她们回归。</p>
            <p>注：实体无法被消灭，但可以被攻击或捕捉，将被捕捉的敌对实体交给互助会同样可以换取积分。</p>
        </template>
    </Base>
</template>

<script setup>
    import { useUsersStore, useOtherStore } from '@/store/store'
    import Base from './Base.vue'
    import { darkroom_text } from '@/assets/TextualData'

    const store = useUsersStore()
    const store_others = useOtherStore()
    const step = ref(store.game_step.darkroom.enemies)

</script>

<style scoped>
</style>

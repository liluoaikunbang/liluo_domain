<template>
    <div class="start">
        <div v-if="step.main.step == 'start'">
            <h2>催更璃落</h2>
            <p>如果您对该游戏有任何意见、看法，或是单纯想调戏璃落，都可以联系这个QQ：2681844592，记得注明来意哦~</p>
            <p>另外，如果您认为该游戏更新较慢，除了QQ联系催更外，也欢淫欣赏下方的催更涩文！</p>
            <p>注：催更涩文发生在一个以现实世界为基底的带有超自然力量的架空都市世界，与穆妮卡帝国所在的架空世界不同，这里的世界观只为催更故事服务，不用纠结关于世界观的细节。</p>

            <br><br>
            <LiButton class="default-button" v-for="item in advanture_text.special_urging" :key="item" @click="clickButton(item)">{{ item.title }}</LiButton>
        </div>
    </div>
</template>

<script setup>
    import { useUsersStore, useOtherStore } from '@/store/store'
    import { advanture_text } from '@/assets/TextualData'
    import { clickJump } from '@/utils'

    const store = useUsersStore()
    const store_others = useOtherStore()
    const step = ref(store.game_step.urging)

    const clickButton = (story) => {
        store_others.current_story = story
        clickJump(['domain', 'phone', 'adventure', story.id])
    }

</script>

<style scoped>
</style>




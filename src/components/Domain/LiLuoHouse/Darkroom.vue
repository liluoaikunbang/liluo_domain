<template>
    <Base :step="step" :return_name="'其他“囚笼”档案'" >
        <template #start_left>
            <h3>基本介绍</h3>

            <LiButton class="default-button" v-for="item in darkroom_text.items" :key="item" @click="store_others.darkroom_item = item ">{{ item.name }}</LiButton>
            
            <h3>档案索引</h3>

            <LiButton class="default-button" @click="store.enterPlace(step, 'levels')">层级档案</LiButton><br>
            <LiButton class="default-button" @click="store.enterPlace(step, 'enemies')">实体档案</LiButton><br>
        </template>
        <template #start_right>
        </template>
    </Base>
</template>

<script setup>
    import { useUsersStore, useOtherStore } from '@/store/store'
    import Base from './Darkroom/Base.vue'
    import { darkroom_text } from '@/assets/TextualData'

    const store = useUsersStore()
    const store_others = useOtherStore()
    const step = ref(store.game_step.darkroom)

</script>

<style scoped>
</style>

<template>
    <Base :step="step" :return_name="'其他层级档案'" >
        <template #start_left>
            <template v-for="item in darkroom_text.levels" :key="item">
                <LiButton class="default-button" @click="store_others.darkroom_item = item ">{{ item.name }}</LiButton>
                <br>
            </template>
        </template>
        <template #start_right>
        </template>
    </Base>
</template>

<script setup>
    import { useUsersStore, useOtherStore } from '@/store/store'
    import Base from './Base.vue'
    import { darkroom_text } from '@/assets/TextualData'

    const store = useUsersStore()
    const store_others = useOtherStore()
    const step = ref(store.game_step.darkroom.levels)

</script>

<style scoped>
</style>

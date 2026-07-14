<template>
    <DomainLayout :return_button_name="'传送回家'" v-if="step.main.step == 'start'">
        <template #left>
            <h3>中央地区</h3>
            <!-- <LiButton class="default-button" @click="clickButton('trials_city')">帝国试炼城（未完善）</LiButton><br> -->
            <LiButton class="default-button" @click="store.enterPlace(step, 'wilderness')">{{ title_base.wilderness.main.title }}</LiButton>
            <LiButton class="default-button" @click="store.enterPlace(step, 'smoke')">{{ title_base.smoke.main.title }}</LiButton>
            <h3>帝国奇观</h3>
            <LiButton class="default-button" @click="store.enterPlace(step, 'springs')">{{ title_base.springs.main.title }}</LiButton>
            <LiButton class="default-button" @click="store.enterPlace(step, 'monster_forest')">{{ title_base.monster_forest.main.title }}</LiButton>
        </template>
        <template #right>
            <h3>帝国大事记(待完善)</h3>
            <a-collapse accordion>
                <a-collapse-item v-for="(event, index) in empire_events" :key="`${index}`" :header="event.date + ':' + event.title">
                    <p v-for="section in splitString(event.content)" :key="section">{{ section }}</p>
                </a-collapse-item>
            </a-collapse>
        </template>
    </DomainLayout>

</template>

<script setup>
    import { useUsersStore, useOtherStore } from '@/store/store'
    import { empire_events } from '@/assets/TextualData'
    import { splitString } from '@/utils'

    const store = useUsersStore()
    const store_others = useOtherStore()
    const step = ref(store.game_step.empire)
    const title_base = store.game_step.empire
</script>

<style scoped>
</style>




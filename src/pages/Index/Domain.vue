<template>
    <DomainLayout :return_button_name="'回自己小窝'" v-if="step.main.step == 'start'">
        <template #left>
            <div>
                <a-tabs default-active-key="1" position="left" class="bottom-box">
                    <a-tab-pane key="1" title="住宅区">
                        <LiButton class="default-button" @click="clickJump([])">回自己小窝</LiButton><br>
                        <LiButton class="default-button" @click="store.enterPlace(step, 'phone')">{{ title_base.phone.main.title }}</LiButton><br>
                        <LiButton class="default-button" @click="store.enterPlace(step, 'neighbors')">{{ title_base.neighbors.main.title }}</LiButton><br>
                        <LiButton class="default-button" @click="store.enterPlace(step, 'jiuer')">{{ title_base.jiuer.main.title }}</LiButton><br>
                    </a-tab-pane>
                    <a-tab-pane key="2" title="商业区">
                        <LiButton class="default-button" @click="store.enterPlace(step, 'experience_shop')">{{ title_base.experience_shop.main.title }}</LiButton><br>
                        <LiButton class="default-button" @click="store.enterPlace(step, 'chamber_shop')">{{ title_base.chamber_shop.main.title }}</LiButton><br>
                        <LiButton class="default-button" @click="store.enterPlace(step, 'cinema')">{{ title_base.cinema.main.title }}</LiButton><br>
                        <LiButton class="default-button" @click="store.enterPlace(step, 'gourmet_palace')">{{ title_base.gourmet_palace.main.title }}</LiButton><br>
                    </a-tab-pane>
                    <a-tab-pane key="3" title="功能区">
                        <LiButton class="default-button" @click="store.enterPlace(step, 'church')">{{ title_base.church.main.title }}</LiButton><br>
                        <LiButton class="default-button" @click="store.enterPlace(step, 'company')">{{ title_base.company.main.title }}</LiButton><br>
                        <LiButton class="default-button" @click="store.enterPlace(step, 'stupid_house')">{{ title_base.stupid_house.main.title }}</LiButton><br>
                    </a-tab-pane>
                </a-tabs>
            </div>

        </template>
        <template #right>
        </template>
    </DomainLayout>

</template>

<script setup>
    import { useUsersStore } from '@/store/store'
    import { clickJump } from '@/utils';

    const store = useUsersStore()
    const step = ref(store.game_step.domain)
    const title_base = ref(store.game_step.domain)

</script>

<style scoped>
    :deep(.arco-tabs-tab-title) {
        color: white;
        font-size: 18px;
    }
</style>



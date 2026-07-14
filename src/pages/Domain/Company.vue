<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <a-collapse>
                <a-collapse-item key="1" header="夕染的后宫日记">
                    <LiButton class="default-button" v-for="item in XiYaLi_text.main" :key="item" @click="enterStoryLink(item)">{{ item.title }}</LiButton><br>
                </a-collapse-item>
                <a-collapse-item key="2" header="番外篇">
                    <LiButton class="default-button" v-for="item in XiYaLi_text.extra" :key="item" @click="enterStoryLink(item)">{{ item.title }}</LiButton><br>
                </a-collapse-item>
            </a-collapse>
        </template>
        <template #right>
            <p>夕押梨集团，缚神领地有能力向外投资的代表企业之一。主营各类妹汁的加工商品，经营范围包含香氛、饮料、药品等。</p>
            <p>大股东：夕染；主要股东：夕染、曦月、多多、小滢、笙宇、狐狐、璃落</p>

            <h3>营业执照</h3>
            <p>(点击图片可查看大图)</p><br>
            <DisplayImage :images="[store_others.all_images.Company_XiYaLi1, store_others.all_images.Company_XiYaLi2]" />
        </template>
    </DomainLayout>

</template>

<script setup>
    import { useUsersStore, useOtherStore } from '@/store/store'
    import { XiYaLi_text } from '@/assets/TextualData'
    import { enterStoryLink } from '@/utils'

    const store = useUsersStore()
    const store_others = useOtherStore()
    const step = ref(store.game_step.domain.company)

    const story = ref()

</script>

<style scoped>
</style>




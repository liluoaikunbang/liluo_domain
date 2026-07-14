<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <slot name="start_left"></slot>
        </template>
        <template #right>
            <slot name="start_right"></slot>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'intro'">
        <template #left>
            <h3>关联条目</h3>
            <template v-for="item in intro_item.relate" :key="item">
                <LiButton class="default-button" @click="clickRelateItem(item)">{{ item.split('|')[1] }}</LiButton>
            </template>
            <hr>
            <br><br>
            <LiButton class="default-button" @click="step.main.step = 'start'; store_others.darkroom_item = null ">{{ return_name }}</LiButton>
        </template>
        <template #right>
            <h3 v-if="intro_item.author">{{ intro_item.name }}(作者：{{ intro_item.author }})</h3>
            <h3 v-else>{{ intro_item.name }}</h3>
            
            <p v-for="section in splitString(intro_item.content)" :key="section">{{ section }}</p>
            <br><br>
            <p v-if="intro_item.gartitude">灵感辅助：{{ intro_item.gartitude }}</p>
            <p v-if="intro_item.inspiration">
                <a v-if="intro_item.inspiration.link" @click="copy(intro_item.inspiration.link)">灵感来源：{{ intro_item.inspiration.name }}(点击可复制链接)</a>
                <template v-else>灵感来源：{{ intro_item.inspiration.name }}</template>
            </p>
        </template>
    </DomainLayout>

</template>

<script setup>
    import { useOtherStore } from '@/store/store'
    import { darkroom_text } from '@/assets/TextualData'
    import { splitString, clickJump } from '@/utils'
    import useClipboard from 'vue-clipboard3'

    const props = defineProps(['step', 'return_name'])

    const store_others = useOtherStore()
    const step = ref(props.step)

    const intro_item = ref('')
    const enterIntroItem = (item) => {
        intro_item.value = item
        step.value.main.step = 'intro'
    }

    const clickRelateItem = (relate_item) => {
        const sub_title = relate_item.split('|')[0]
        store_others.darkroom_item = darkroom_text[sub_title].filter((sub_item) => { return sub_item.name == relate_item.split('|')[1] })[0]


        if(sub_title == 'items') { clickJump(['darkroom']) }
        else { clickJump(['darkroom', sub_title]) }
    }

    onMounted(() => {
        if(store_others.darkroom_item){
            enterIntroItem(store_others.darkroom_item)
        }
    })
    watchEffect(() => {
        if(store_others.darkroom_item){
            enterIntroItem(store_others.darkroom_item)
        } else {
            step.value.main.step = 'start'
        }
    })

    const copy = (link) => {
        const { toClipboard } = useClipboard()
        toClipboard(link)
        console.log('链接复制成功')
    }

</script>

<style scoped>
</style>

<template>
    <DomainLayout :not_display_detail="true">
        <template #left>
        </template>
        <template #right>
            <DisplayStory :story="store_others.current_story" />
        </template>
    </DomainLayout>
</template>

<script>
import { useOtherStore } from '@/store/store'
import DisplayStory from './DisplayStory.vue'
import DomainLayout from './DomainLayout.vue'
export default {
    components:[
        DomainLayout,
        DisplayStory,
    ],
    props: [''],
    setup() {

    const store_others = useOtherStore()

    return {
            store_others,
        }
    }
}
</script>

<style scoped>
</style>



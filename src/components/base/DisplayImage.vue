<template>
    <template v-if="typeof(images) == 'string'">
        <a-image
            v-if="store_others.all_images?.[String(images).toLowerCase()]?.src"
            :src="store_others.all_images[String(images).toLowerCase()].src"
            :width="store_others.getImageWidth()"
            :title="store_others.all_images[String(images).toLowerCase()].title"
            footer-position="outer"
        />
    </template>
    <template v-else>
        <a-image v-if="images && !Array.isArray(images) && images.src" :src="images.src" :width="store_others.getImageWidth()" :title="images.title" footer-position="outer"/>
        <template v-if="Array.isArray(images) && images.length">
            <a-image
                v-for="(image, idx) in images"
                :key="idx"
                v-if="image && image.src"
                :src="image.src"
                :width="store_others.getImageWidth() / images.length"
                :title="image.title"
                footer-position="outer"
            />
        </template>
    </template>
</template>

<script>
import { useOtherStore } from '@/store/store'
export default {
    components: {
    },
    props: ['images'],
    setup(props) {

    const store_others = useOtherStore()

    return {
            store_others,
        }
    }
}
</script>

<style scoped>
</style>



<template> 
    <div class="layout" :style="main_style">
        <img v-if="bgSrc" :src="bgSrc" class="main-background">
        <router-view />
    </div>
</template>

<script setup>
    import { computed, reactive, onMounted } from 'vue'
    import { useOtherStore } from "@/store/store"

    const store_others = useOtherStore()

    // 自动import路径下的所有图片，包括子文件夹内的图片（通过**/*实现）
    const import_images = import.meta.glob('../assets/images/**/*', {
        eager: true,
        import: 'default',
        query: '?inline',
    })
    const image_list = {}

    for (const [file, url] of Object.entries(import_images)) {
        // 关键：用 file（原始文件路径）来取名字，永远稳定
        let name = file.split('/').pop().split('.')[0].split('-')[0]
        name = name.toLowerCase()
        image_list[name] = { src: url, title: '' }
    }

    store_others.all_images = image_list

    const bgSrc = computed(() => store_others.all_images?.background?.src || '')

    onMounted(() => {
        transformScreen()
    })

    const main_style = reactive({
        height: '100vh',
        width: '100%',
        top: '0',
        left: '0',
    })
    const transformScreen = () => { // 手机端横屏
        const width = document.documentElement.clientWidth;
        const height =  document.documentElement.clientHeight;
        if( width < height ){
            // 横屏，本质上是让页面从左上角旋转90度然后向右平移一个屏幕的距离，即可做到横屏效果。
            console.log(width + ',' + height)
            main_style.height = `${width}px`
            main_style.width = `${height}px`
            main_style.top = '0'
            main_style.left = `${width}px`
            // 旋转
            main_style['transform'] = 'rotate(90deg)'
            main_style['-ms-transform'] = 'rotate(90deg)'
            main_style['-moz-transform'] = 'rotate(90deg)'
            main_style['-webkit-transform'] = 'rotate(90deg)'
            main_style['-o-transform'] = 'rotate(90deg)'
            main_style['transform-origin'] = 'top left' // 设置旋转中心
        }
    }

</script>

<style scoped>
    /* 框架 */
    .layout {
        position: fixed;
        text-align: center;
        /* transform:rotate(90deg);
        -ms-transform:rotate(90deg);
        -moz-transform:rotate(90deg);
        -webkit-transform:rotate(90deg);
        -o-transform:rotate(90deg); */
    }
    .main-background {
        position: absolute;
        z-index: -1;
        opacity:0.1; /* 透明度 */
        width: 100%;
        height: 100%;
        left: 0;
    }
</style>



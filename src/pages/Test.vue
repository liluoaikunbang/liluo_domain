<template>
    <!-- 工具区 -->
    <a class="tools menu" href="#" v-if="menu_drawer.able" @click="menu_drawer.drawer = true">菜单</a>
    <a class="tools top" href="#" @click="scrollWindow('top')">顶部</a>
    <a class="tools bottom" href="#" @click="scrollWindow('bottom')">底部</a>

    <!-- 菜单抽屉 -->
    <a-drawer :width="340" :placement="'left'" :footer="false" :visible="menu_drawer.drawer" @cancel="clickCancel()" unmountOnClose>
        <template #title>
            游戏菜单（未完善）
        </template>
        <Menu />
    </a-drawer>

</template>

<script>
import { useUsersStore } from '../store/store'


export default {
    components: {
        LiButton,
    },
    setup() {

        const store = useUsersStore()
        const main_step = ref('start')
        const main_style = reactive({
            height: '100vh',
            width: '100%',
            top: '30px',
            left: '0',
        })

        const transformScreen = () => {
            const width = document.documentElement.clientWidth;
            const height =  document.documentElement.clientHeight;
            if( width < height ){
                // 横屏，本质上是让页面从左上角旋转90度然后像又平移一个屏幕的距离，即可做到横屏效果。
                console.log(width + ',' + height)
                main_style.height = `${width}px`
                main_style.width = `${height}px`
                main_style.top = '0'
                main_style.left = `${width - 15}px`
                main_style['transform'] = 'rotate(90deg)'
                main_style['-ms-transform'] = 'rotate(90deg)'
                main_style['-moz-transform'] = 'rotate(90deg)'
                main_style['-webkit-transform'] = 'rotate(90deg)'
                main_style['-o-transform'] = 'rotate(90deg)'
                main_style['transform-origin'] = 'top left' // 设置旋转中心
            }
        }

        onMounted(() => {
            transformScreen()
        })



        return {
            main_step, main_style,
        }
    }
}

</script>

<style scoped>
</style>




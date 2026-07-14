<template>
    <!-- 用于在小游戏中快捷查看临时变量 -->
    <a class="tools data-menu" :style="{top: getTopStyle() + 'px'}" href="#" @click="drawer = true">{{ name }}</a>

    <a-drawer :width="340" :placement="'left'" :footer="false" :visible="drawer" @cancel="drawer = false" unmountOnClose>
        <template #title>
            {{ title }}
        </template>
        <slot></slot>
    </a-drawer>
</template>

<script>
import LiButton from './LiButton.vue';
import { useUsersStore } from '@/store/store';

export default {
    components: {
        LiButton,
    },
    props: ['name', 'title'],
    setup(props) {

        const store = useUsersStore()
        const drawer = ref(false)

        const getTopStyle = () => {
            if(!store.game_step.game_menu.able){ // 如果原游戏菜单位置不展示菜单按钮，则该组件对应的按钮展示在那个位置
                return '10'
            }
            else { // 否则展示在下方
                return '85'
            }
        }

        return {
            drawer,
            getTopStyle,
        }
    }
}
</script>

<style scoped>
    .tools {
        position: fixed; /* 相对于浏览器窗口定位它们 */
        left: 0px; 
        z-index: 10;
        width: 60px; /* 设置特定宽度 */
        text-decoration: none; /* 删除下划线 */
        font-size: 15px; /* 增加字体大小 */
        color: white; /* 白色文本颜色 */
        border-radius: 0 5px 5px 0; /* 右上角和右下角的圆角 */
        background: rgb(195, 94, 195);
    }
    .data-menu {
        top: 85px;
    }
</style>



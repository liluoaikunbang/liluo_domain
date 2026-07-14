<template>
    <div class="box left" id="left">
        <h2 v-if="!not_display_title">{{ step_name }}</h2>

        <div class="left-content">
            <slot name="left"></slot>
        </div>

        <h3>功能按钮</h3>
        <LiButton class="layout-button" v-if="store.game_step.title != base_title" @click="clickReturn()">
            <span v-if="return_button_name">{{ return_button_name }}(返回)</span>
            <span v-else>返回</span>
        </LiButton><br><br>
        <LiButton class="layout-button" @click="clickScroll('up')">向上翻页</LiButton>
        <LiButton class="layout-button" @click="clickScroll('down')">向下翻页</LiButton><br>
        <LiButton class="layout-button" @click="clickScroll('top')">吊缚(置顶)</LiButton>
        <LiButton class="layout-button" @click="clickScroll('bottom')">活埋(置底)</LiButton>
        <!-- <a-collapse accordion @change="openCollapse()">
            <a-collapse-item key="1" header="功能按钮">
                <LiButton class="layout-button" @click="clickScroll('up')">向上翻页</LiButton>
                <LiButton class="layout-button" @click="clickScroll('down')">向下翻页</LiButton><br>
                <LiButton class="layout-button" @click="clickScroll('top')">置顶（吊缚）</LiButton>
                <LiButton class="layout-button" @click="clickScroll('bottom')">置底（活埋）</LiButton>
            </a-collapse-item>
        </a-collapse> -->
    </div>
    <div class="box right" id="right">
        <br>
        <div class="right-content">

            <!-- 展示对该地方的介绍 -->
            <template v-if="store.current_step && store.current_step.main.detailed && store.current_step.main.step == 'start' && !not_display_detail">
                <DisplayImage v-if="store.current_step.main.detailed.image_before" :images="other_store.all_images[store.current_step.main.detailed.image_before]" />
                <DisplayPlace :place="store.current_step.main.detailed" />
                <DisplayImage v-if="store.current_step.main.detailed.image_after" :images="other_store.all_images[store.current_step.main.detailed.image_after]" />
            </template>
            
            <slot name="right"></slot>

        </div>
    </div>
</template>

<script>
import { useUsersStore, useOtherStore } from '@/store/store'
import LiButton from './LiButton.vue'
import DisplayPlace from './DisplayPlace.vue'
import DisplayImage from './DisplayImage.vue'
import router from '@/router';
import { base_title } from '../Index/GameStep'
export default {
    components: {
        LiButton,
        DisplayPlace,
        DisplayImage,
    },
    props: ['return_button_name', 'not_display_title', 'not_display_detail'],
    setup(props) {
        const store = useUsersStore()
        const other_store = useOtherStore()
        const step_name = ref(store.game_step.title) // 当前所处位置的地名
        let right_box = null

        onMounted(() => {
            // watch(() => step_name, (new_val, old_val) => { // 当前位置变动后的操作
            //     step_name.value = store.game_step.title
            //     setTimeout(() => {
            //         right_box.scrollTop = right_box.scrollHeight;
            //     }, 20); // 注意这里需要延迟20ms正好可以获取到更新后的dom节点
            // }, {deep: true})
            right_box = document.getElementById("right")
            other_store.right_size = {width: right_box.offsetWidth, height: right_box.offsetHeight}
            // console.log(other_store.right_size)
        })

        const clickReturn = () => {
            let place_values = router.currentRoute.value.fullPath.split('/')
            place_values = place_values.slice(0, place_values.length - 1)
            router.push({
                path:place_values.join('/')
            })
            // 将store_others中各个组件的临时变量也还原回去
            other_store.initStoreItems()
        }

        const openCollapse = () => {
            const left_box = document.getElementById("left")
            left_box.scrollTop = left_box.scrollHeight
        }

        const clickScroll = (scroll_mode) => {
            // right_box = document.getElementById("right")
            if(scroll_mode == 'down') {
                right_box.scrollTop += right_box.offsetHeight * 0.8
            } else if(scroll_mode == 'up') {
                right_box.scrollTop -= right_box.offsetHeight * 0.8
            } else if(scroll_mode == 'top') {
                right_box.scrollTop = 0
            } else if(scroll_mode == 'bottom') {
                right_box.scrollTop = right_box.scrollHeight
                // console.log(right_box.scrollTop, right_box.offsetHeight)
            }
        }

        return {
            store, other_store, step_name, base_title,
            clickReturn, openCollapse, clickScroll,
        }
    }
}
</script>

<style scoped>
    .box {
        overflow: auto;
        border: 3px solid pink;
        border-radius: 5px;
        margin: 0 10px 0 10px;
    }
    .left {
        width: 50%;
        height: 90%;
    }
    .left-content {
        margin: 5px;
    }
    .right {
        width: 50%;
        height: 90%;
    }
    .right-content {
        margin: 5px;
    }
    .layout-button {
        margin: 0 10px 10px 10px;
    }
</style>



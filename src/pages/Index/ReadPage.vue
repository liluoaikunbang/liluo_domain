<template>
    <!-- 工具区 -->
    <a class="tools menu" @click="menu_drawer = true">菜单</a>
    <a class="tools top" @click="scrollWindow('top')">吊绑</a>
    <a class="tools bottom" @click="scrollWindow('bottom')">地缚</a>

    <!-- 菜单抽屉 -->
    <a-drawer :width="340" :placement="'left'" :footer="false" :visible="menu_drawer" @cancel="menu_drawer = false" unmountOnClose>
        <template #title>
            小说大纲
        </template>
        <StoryMenu />
    </a-drawer>

    <div class="main">
        <div v-if="current_story == 0">
            <h2>阅读模式</h2>
            <p>阅读模式为专门为手机端制作的方便阅读小说的模式，该模式下将变为竖屏，并展示游戏中展示的小说列表。但此模式阉割了大多数游戏内容，如需切换为正常游戏模式，可点击页面底部的离开书房（切换为游戏模式）按钮。</p>
            <p>点击左上角的 菜单 按钮可弹出小说大纲进行选择。</p>
            <p>注：电脑端不建议开启阅读模式。</p>
            <a-collapse accordion>
                <a-collapse-item header="小说大纲" key="1">
                    <StoryMenu />                
                </a-collapse-item>
            </a-collapse>
        </div>

        <div v-else>
            <DisplayStory :story="current_story" />
        </div>
    </div>

    <LiButton class="return-button" @click="clickReturn()">离开书房（切换为游戏模式）</LiButton>
</template>

<script setup>
    import StoryMenu from '@/components/Index/ReadPage/StoryMenu.vue'
    import { scrollWindow } from '@/utils'
    import { useUsersStore, useOtherStore } from '@/store/store'
    import router from '@/router'
    import { base_value } from '@/components/Index/GameStep'

    const store = useUsersStore()
    const store_others = useOtherStore()
    const menu_drawer = ref(false)
    const current_story = ref(store_others.current_story)

    const clickReturn = () => {
        if(store_others.backup_link){
            router.push({
                path: store_others.backup_link
            })
        } else {
            router.push({
                path: `/${base_value}`
            })
        }
    }

    watchEffect(() => { // 通过watcheffect监视store_others.current_story，改变时立即改变current_story的值
        // console.log('story changed to', store_others.current_story)
        current_story.value = store_others.current_story
        menu_drawer.value = false
    })

</script>

<style scoped>
    .main {
        margin-left: 10px;
    }

    /* 为 sidenav 内的链接设置样式 */
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
    .menu {
        top: 10px;
    }
    .top {
        top: 35px;
    }
    .bottom {
        top: 60px;
    }
</style>




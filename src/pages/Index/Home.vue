<template>
    <div class="start">
        <!-- 游戏前的菜单 -->
        <h2>璃落的冒险</h2>
        <p>欢迎游玩璃落的冒险，在本游戏中，你将扮演名为璃落的女孩，经历她所走过的奇妙历程，见证她的记忆与成长。</p>
        <p>游戏中大部分内容为第三人称视角，仅一些小游戏中切换为其他视角方便带入。</p>
        <p>注1：虚拟娱乐作品，请勿模仿！且本作只供小圈内浏览，请勿将游戏本体向他人传播。</p>
        <p>注2：使用手机端进入时请关闭手机的 屏幕自动旋转 功能，否则可能出现排版混乱等问题。</p>
        <p>注3：使用手机端进入游戏后如出现无法滑动屏幕等bug，回退页面后重新进入网站即可解决。</p>
        
        <div class="notice">
            <p>更新公告：{{ update_log[0].year + '年' + update_log[0].month + '月' + update_log[0].date + '日' + '，' + update_log[0].content }}</p>
        </div>

        <br>
        <LiButton class="default-button" @click="$router.push('liluo_house')">开始游戏</LiButton><br>
        <LiButton class="default-button" @click="$router.push('urging')">催更璃落</LiButton><br>
        <LiButton class="default-button" @click="$router.push('update')">更新日志</LiButton><br>
        <LiButton class="default-button" @click="$router.push('gartitude')">鸣谢列表</LiButton><br>
    </div>
</template>

<script setup>
    import lodash from 'lodash'
    import { useOtherStore } from '@/store/store'
    import { update } from '@/components/Index/Update.js'

    const store_others = useOtherStore()

    // 处理更新日志
    const update_log = lodash.reverse(update) // 将更新日志列表逆置，让最新更新记录放在最前面

</script>

<style scoped>
    .notice {
        width: 100%;
        height: 130px;
        overflow: auto;
        border: 3px solid pink;
        border-radius: 5px;
    }
</style>





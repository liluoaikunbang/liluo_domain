<template>
    <template v-if="place.second">
        <!-- 如果第一次来这个地方，展示的内容 -->
        <template v-if="place.content && judgeSecond() <= 1">
            <p class="introduction" v-for="section in splitString(place.content)" :key="section">
                <LiText :text="section" />
            </p>
        </template>
        <!-- 如果第二次来到这个地方，则展示另一部分内容 -->
        <template v-if="place.second && judgeSecond() > 1">
            <p class="introduction" v-for="section in splitString(place.second)" :key="section">
                <LiText :text="section" />
            </p>
        </template>
    </template>
    <template v-else>
        <template v-if="place.content">
            <p class="introduction" v-for="section in splitString(place.content)" :key="section">
                <LiText :text="section" />
            </p>
        </template>
    </template>

    <br>
    <template v-if="place.introduction">
        <p class="content" v-for="section in splitString(place.introduction)" :key="section">
            <LiText :text="section" />
        </p>
    </template>
</template>

<script>
import { splitString } from '@/utils'
import { useUsersStore } from '@/store/store'
import router from '@/router'
export default {
    components: {
    },
    props: ['place'],
    setup(props) {

        const store = useUsersStore()
        
        const judgeSecond = () => { // 判断是否是第一次进入该位置
            const current_route = router.currentRoute.value.fullPath
            let p = store.game_step
            let place_values = current_route.split('/').filter((item) => { return item }) // 拆分链接并去重
            place_values = place_values.slice(1, place_values.length)
            
            if(!place_values.length) { return store.game_step.main.enter_count }
            for(let i = 0; i < place_values.length; i++){ // 循环找到需要修改的地方
                p = p[place_values[i]]
            }
            return p.main.enter_count
        }

        return {
            judgeSecond,
            splitString,
        }
    }
}
</script>

<style scoped>
    .content {
        font-style: italic;
        color:rgba(255,255,255,0.8)
    }
</style>



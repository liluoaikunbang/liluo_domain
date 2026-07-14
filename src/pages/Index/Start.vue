<template>
    <!-- 开始游戏 -->
    <div class="domain">

        <div class="domain-title">
            <div>
                <p style="font-size: 20px; margin-left: 30px; text-indent: 0;">{{ location }}</p>
                <p style="font-size: 17px; margin-left: 30px; text-indent: 0; color: lightblue;">时间——8:00 AM</p>
            </div>
            <p style="font-size: 30px; margin-right: 40px; color: aqua; width: 230px;">璃落的冒险</p>
        </div>
        <div class="domain-content">
            <router-view />
        </div>
    </div>
</template>

<script setup>
    import { useUsersStore, useOtherStore } from "@/store/store"
    import router from "@/router"
    import { base_value, base_title } from '@/components/Index/GameStep'
    import { all_stories } from '@/assets/TextualData'

    const store = useUsersStore()
    const store_others = useOtherStore()

    const init_title = `位置：${base_title}`
    const location = ref(init_title) // 到达所处位置的路线

    const handleChangeRoute = () => {
        const current_route = router.currentRoute.value.fullPath

        let story_step = false // 记录现在的step是否是story_step
        if(current_route.includes(base_value)){ // 只在链接中包含base_value时执行，此时才是游戏开始后的界面
            location.value = init_title // 还原location为初始值
            let place_values = current_route.split('/').filter((item) => { return item }) // 拆分链接并去重
            place_values = place_values.slice(1, place_values.length)
            // console.log(place_values)

            if(!place_values.length) { // 列表为空，代表目前处于base_value位置。
                store.current_step = store.game_step
                location.value = init_title
                store.game_step.title = base_title
            } else {
                let p = store.game_step
                for(let i = 0; i < place_values.length; i++) {
                    if(p[place_values[i]]){
                        p = p[place_values[i]]
                        location.value += '->' + p.main.title
                    } else {
                        story_step = true
                        break
                    }
                }
                // console.log(p)
                store.current_step = p
                store.game_step.title = p.main.title
            }
            // 将current_step及其下属的所有step都还原成start
            if(store.current_step.main) { store.current_step.main.step = 'start' }
            for(let key in store.current_step){
                if(store.current_step[key].main){ store.current_step[key].main.step = 'start' }
            }
            // console.log(store.current_step)
            store.current_step.main.enter_count += 1
        }

        // 新打开链接后，使用current_story定位到具体文章。
        if(story_step && !store_others.current_story){
            const story_id = current_route.split('/')[current_route.split('/').length - 1]
            const story_list = []
            for(let i = 0; i < all_stories.length; i++){
                if(all_stories[i].content){
                    for(let j=0; j < all_stories[i].content.length; j++){
                        story_list.push(all_stories[i].content[j])
                    }
                }
            }

            // console.log(story_list[0].id)
            // console.log(story_id)
            const current_story = story_list.filter((item) => { return item.id == story_id })[0]
            if(current_story) { store_others.current_story = current_story }   
        }
    }

    watch(() => router.currentRoute.value.fullPath, handleChangeRoute)
    handleChangeRoute()

</script>

<style scoped>
    .domain {
        width: 100%;
        height: 100%;
    }
    .domain-title {
        margin: 0px 0 0px 0;
        display: flex;
        justify-content: space-between;
    }
    .domain-content {
        width: 98%;
        height: 85%;
        display: flex;
        flex-direction: row;
    }
</style>




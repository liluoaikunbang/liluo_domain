<template>
    <DomainLayout>
        <template #left>
        </template>
        <template #right>
            <p>“小羽给璃落讲个故事吧，就每天睡觉时候讲的那种。”</p>
            <p>“诶？但现在可不是晚安时间呀。”</p>
            <p>“可是咱想听了呀，讲一个嘛讲一个嘛，短一些的就行！”璃落拽着小羽的袖子开始撒起娇来。</p>
            <p>“好吧好吧。”小羽很快败下阵来，“让我想想，今天，该讲哪一个了。”</p>
            <p>(注：小羽会在11个小睡前故事中随机挑选一个来讲述，如果想听不同的故事可以反复点击“讲个故事吧”按钮。)</p>

            <h3>{{ story_value.title }}</h3>
            <p v-for="section in splitString(story_value.content)" :key="section">{{ section }}</p>
            <br><br><br><br><br>

            <p>“好啦，故事结束了，可以放小羽去干活了吧。”小羽无奈地看着还在抱着自己胳膊的璃落，明明小小姐只比自己小了两岁，却感觉一直没有长大。</p>
            <p>“嗯嗯嗯嗯！”璃落赶紧点头，却没有放开小羽的意思，“这次终于听到了完整的故事……以前小羽也会这样每天给璃落讲故事吗？可惜咱想不起来了……”</p>
            <p>“没关系的，不管璃落记不记得，小羽都会一直陪着璃落的。”小羽放弃了把胳膊从璃落手中抽出来，用另一只手轻轻拍了拍有些失落的璃落。</p>
            <p>“嗯嗯！”</p>
        </template>
    </DomainLayout>
</template>

<script setup>
    import { randomElement, splitString } from '@/utils.js'
    import { maid_story } from './MaidStory'

    const story_value = ref(randomElement(maid_story))
</script>

<style scoped>
</style>

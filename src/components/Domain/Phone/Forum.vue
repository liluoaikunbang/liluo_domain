<template>

    <DomainLayout>
        <template #left>
            <LiButton class="default-button" @click="mode = 'all'">全部帖子</LiButton>
            <LiButton class="default-button" v-for="button in all_labels" :key="button" @click="mode = button">#{{ button }}#</LiButton>
        </template>
        <template #right>
            <p>(上层叙事：璃谱论坛主要用于记录涩涩相关的有趣梗、灵感、小段落等，整活较多。大家有相关素材的欢淫来找璃落投稿呀！)</p>

            <!-- 帖子展示 --> 
            <div class="forum-card" v-for="post in posts" :key="post" v-show="post.label == mode || mode == 'all'">
                <p class="forum-title">{{ post.title }}</p>
                <p class="forum-title">{{ post.date }}</p>
                <LiButton class="default-button" @click="mode = post.title">详情页</LiButton><br>

                <div class="floor">
                    <p class="floor-title">{{ post.author }}(楼主)：</p><br>
                    <p v-for="section in splitString(post.content)" :key="section">{{ section }}</p>
                    <p class="floor-foot">第1楼</p>
                    <hr><br>
                </div>
                <div class="floor" v-for="(floor, index) in post.floors" :key="floor">
                    <p class="floor-title" v-if="!floor.reply">{{ floor.author }}<span v-if="floor.author == post.author">(楼主)</span>：</p>
                    <p class="floor-title" v-else>
                        {{ floor.author }}<span v-if="floor.author == post.author">(楼主)</span> 回复给 
                        {{ floor.reply }}<span v-if="floor.reply == post.author">(楼主)</span>：</p>
                    <p v-for="section in splitString(floor.content)" :key="section">{{ section }}</p>
                    <br>
                    <p class="floor-foot">第{{ index + 2 }}楼</p>
                    <hr><br>
                </div>
                <p class="floor-foot">(灵感来源：{{ post.origin }})</p>
            </div>

            <!-- 帖子详情 -->
            <div v-for="post in posts" :key="post" v-show="post.title == mode">
                <p class="forum-title">{{ post.title }}</p>
                <p class="forum-title">{{ post.date }}</p><br>

                <div class="floor">
                    <p class="floor-title">{{ post.author }}(楼主)：</p><br>
                    <p v-for="section in splitString(post.content)" :key="section">{{ section }}</p>
                    <p class="floor-foot">第1楼</p>
                    <hr><br>
                </div>
                <div class="floor" v-for="(floor, index) in post.floors" :key="floor">
                    <p class="floor-title" v-if="!floor.reply">{{ floor.author }}<span v-if="floor.author == post.author">(楼主)</span>：</p>
                    <p class="floor-title" v-else>
                        {{ floor.author }}<span v-if="floor.author == post.author">(楼主)</span> 回复给 
                        {{ floor.reply }}<span v-if="floor.reply == post.author">(楼主)</span>：</p>
                    <p v-for="section in splitString(floor.content)" :key="section">{{ section }}</p>
                    <br>
                    <p class="floor-foot">第{{ index + 2 }}楼</p>
                    <hr><br>
                </div>
                <p class="floor-foot">(灵感来源：{{ post.origin }})</p>
            </div>
        </template>
    </DomainLayout>

</template>

<script setup>
    import { splitString, } from '@/utils.js'
    import lodash from 'lodash'
    import { forum_text } from '@/assets/TextualData.js'

    const mode = ref('置顶')

    // 将帖子列表逆置，让最新的帖子放在最前面
    const posts = lodash.reverse(forum_text)
    // 将所有标签提取为列表方便取用
    const all_labels = lodash.union(forum_text.map((item) => { return item.label }))

</script>

<style scoped>
    .forum-card {
        height: 200px;
        width: 95%;
        margin-bottom: 20px;
        border: 3px solid pink;
        border-radius: 5px;
        /* background: white; */
        overflow: auto;
    }
    .forum-title {
        text-indent: 0;
        text-align: center;
        font-size: 25px;
        margin: 0 0 0 0;
    }
    .floor {
        padding: 0 5px 0 5px;
    }
    .floor-title {
        text-indent: 0;
        text-align: start;
        font-size: 22px;
        margin: 0 0 0 0;
    }
    .floor-foot {
        text-indent: 0;
        text-align: start;
        font-size: 18px;
        margin: 0 0 0 0;
    }
</style>




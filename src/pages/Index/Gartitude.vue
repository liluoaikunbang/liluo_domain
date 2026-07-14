<template>
    <div class="start">
        <h2>鸣谢列表</h2>
        <a-collapse>
            <a-collapse-item v-for="(item, index) in gartitude" :key="`${index}`" :header="item.place">
                <template v-for="sub_item in item.content" :key="sub_item">
                    <p>
                        {{ sub_item.construction }}
                        <LiButton class="default-button" @click="clickJump(sub_item.path)">跳转</LiButton>
                        <a v-if="sub_item.premiere" @click="copy(sub_item.premiere.link)">(首发/画师/作者网站：{{ sub_item.premiere.title }}，点击可复制链接)</a>
                    </p>
                </template>
            </a-collapse-item>
            <!-- 查看作者和画师的价格时使用，平时此模块直接注释掉即可 -->
            <!-- <a-collapse-item :key="`${gartitude.length}`" header="有偿约稿">
                <template v-for="item in gartitude" :key="item">
                    <template v-for="sub_item in item.content" :key="sub_item">
                        <p v-if="sub_item.price">
                            {{ sub_item.construction }}话费{{ sub_item.price }}元。
                            <a v-if="sub_item.premiere" @click="copy(sub_item.premiere.link)">(首发/画师/作者网站：{{ sub_item.premiere.title }}，点击可复制链接)</a>
                        </p>
                    </template>
                </template>
            </a-collapse-item> -->
        </a-collapse>
        <LiButton class="return-button" @click="$router.push('home')">游戏主菜单</LiButton>
    </div>
</template>

<script setup>
    import { useUsersStore } from '@/store/store'
    import { darkroom_text, forum_text, springs_text, neighbors_text, cinema_text, monster_dictionary_text } from '../../assets/TextualData'
    import { clickJump } from '@/utils'
    import useClipboard from 'vue-clipboard3'

    const store = useUsersStore()

    const copy = (link) => {
        const { toClipboard } = useClipboard()
        toClipboard(link)
        console.log('链接复制成功')
    }

    const gartitude = [
        // {
        //     place: '缚神领地-住宅区-小别野',
        //     content: [
        //         {
        //             construction: `感谢${Array.from(new Set(neighbors_text.stories.map((item) => {return item.author}))).join('、')}等小可爱们创作的领地小故事。`,
        //             path: ['domain', 'neighbors'],
        //         },
        //     ],
        // },
        {
            place: '缚神领地-住宅区-小别野-神秘的暗室',
            content: [
                {
                    construction: `感谢${Array.from(new Set(darkroom_text.levels.map((item) => {return item.author}))).join('、')}等小可爱们创作的涩涩后室相关词条。`,
                    path: ['darkroom', 'levels'],
                },
            ],
        },
        {
            place: '缚神领地-住宅区-找邻居串门',
            content: [
                {
                    construction: `感谢${Array.from(new Set(neighbors_text.stories.map((item) => {return item.author}))).join('、')}等小可爱们创作的领地小故事。`,
                    path: ['domain', 'neighbors'],
                },
            ],
        },
        {
            place: '缚神领地-住宅区-刷刷手机-璃谱论坛',
            content: [
                {
                    construction: `感谢${Array.from(new Set(forum_text.map((item) => {return item.origin}))).join('、')}等小可爱们为璃谱论坛提供的灵感。`,
                    path: ['domain', 'phone', 'forum'],
                },
            ],
        },
        {
            place: '缚神领地-住宅区-神秘小屋',
            content: [
                {
                    construction: '感谢玖儿同璃落联文创作的小说《病娇恋》。',
                    path: ['domain', 'jiuer'],
                },
                {
                    construction: '感谢玖儿提供的玖儿人设图。',
                    path: ['domain', 'jiuer'],
                },
            ],
        },
        {
            place: '缚神领地-商业区-缚之魂影院',
            content: cinema_text.map((item) => {
                return {
                    construction: `感谢${item.author}以璃落为主角创作的涩文·《${item.title}》。`,
                    price: item.price,
                    premiere: item.premiere,
                    path: ['domain', 'cinema'],
                }
            }),
        },
        {
            place: '缚神领地-商业区-密室逃脱店',
            content: [
                {
                    construction: '感谢小萌同学创作的逃脱剧本《别墅美女失踪事件》。',
                    path: ['domain', 'chamber_shop', 'chamber3'],
                },
            ],
        },
        {
            place: '缚神领地-功能区-缚神殿',
            content: [
                {
                    construction: '感谢姬旦公主创作的领地大事记《紧缚圣女加冕事件》。',
                    path: ['domain', 'church'],
                },
            ],
        },
        {
            place: '缚神领地-功能区-公司集团',
            content: [
                {
                    construction: '感谢小滢为 夕押梨集团 制作的营业证书。',
                    path: ['domain', 'company'],
                },
                {
                    construction: '感谢夕染提供的涩文《夕染的后宫日记1》以及《颜子遇险记》。',
                    path: ['domain', 'company'],
                },
            ],
        },
        {
            place: '缚神领地-功能区-笨笨之家',
            content: [
                {
                    construction: '感谢楚十郎为笨笨之家绘制的色图《猫璃璃》和《笨笨之家开业图》。',
                    premiere: {title: 'Pixiv', link: 'https://www.pixiv.net/users/70704599'},
                    price: '100每张',
                    path: ['domain', 'stupid_house',],
                },
            ],
        },
        {
            place: '穆妮卡帝国-炊烟之城',
            content: [
                {
                    construction: '感谢夕染提供的系列涩文《神秘商人的奇物售货日志》。',
                    path: ['empire', 'smoke'],
                },
            ],
        },
        {
            place: '穆妮卡帝国-荒野（包含醉欲之城、深渊幽狱）',
            content: [
                {
                    construction: '感谢玥淼创作的帝国监狱小故事《黑狱深牢的淫狐》。',
                    path: ['empire', 'wilderness', 'prison'],
                },
                {
                    construction: '感谢归鸠为《被押入海绵牢房的囚犯》绘制的色图。',
                    path: ['empire', 'wilderness', 'prison'],
                },
                {
                    construction: '感谢玥淼为监狱小故事《黑狱深牢的淫狐》绘制的色图。',
                    path: ['empire', 'wilderness', 'prison'],
                },
                {
                    construction: '感谢姬旦创作的监狱故事《公主的囚室》（醉欲之城-笔记-公主的囚室）。',
                    path: ['empire', 'wilderness', 'prison'],
                },
                {
                    construction: '感谢玥淼创作的醉欲之城及深渊幽狱相关介绍。',
                    path: ['empire', 'wilderness'],
                },
            ],
        },
        {
            place: '穆妮卡帝国-温泉湖小镇',
            content: [
                {
                    construction: `感谢${springs_text.new_year_2024.map((item) => { return item.author }).join('、')}等小可爱在 2024春节温泉节主题征文活动 中创作的温泉节相关涩文`,
                    path: ['empire', 'springs', 'festival'],
                },
                {
                    construction: '感谢surtr-电脑西为温泉节活动绘制的宣传色图《温泉中的璃落》。',
                    premiere: {title: 'Pixiv', link: 'https://www.pixiv.net/users/90937455'},
                    price: '250',
                    path: ['empire', 'springs', 'festival'],
                },
            ],
        },
        {
            place: '穆妮卡帝国-魔物森林-蜘蛛神社',
            content: [
                {
                    construction: `感谢红豆和阳光提供的涩文《阳光的寻宝之旅》。`,
                    path: ['empire', 'monster_forest', 'shrine'],
                },
                {
                    construction: `感谢阳光提供的蜘蛛神社地图和阳光人设图`,
                    path: ['empire', 'monster_forest', 'shrine'],
                },
                {
                    construction: `感谢${Array.from(new Set(monster_dictionary_text.map((item => { return item.author})))).join('、')}为魔物介绍指南创作的魔物介绍条目。`,
                    path: ['empire', 'monster_forest', 'monster_dictionary'],
                },
                {
                    construction: `感谢阳光提供的涩图组成相册`,
                    premiere: {title: 'Pixiv', link: 'https://www.pixiv.net/users/6054737'},
                    path: ['empire', 'monster_forest', 'shrine', 'photos'],
                },
            ],
        },
    ]

</script>

<style scoped>
</style>





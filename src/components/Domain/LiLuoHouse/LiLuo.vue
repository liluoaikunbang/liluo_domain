<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <a-tabs position="left">
                <a-tab-pane key="1" title="走廊">
                    <LiButton class="default-button" @click="step.main.step = 'book'">小册子</LiButton><br>
                    <LiButton class="default-button" @click="step.main.step = 'photos'">照片墙</LiButton><br>
                    <LiButton class="default-button" @click="store.enterPlace(step, 'stupid_map')">笨璃璃世界地图</LiButton><br>
                </a-tab-pane>
                <a-tab-pane key="2" title="牢房">
                    <LiButton class="default-button" @click="step.main.step = 'bed'; sub_step = 'bed_1'">笼内公主床</LiButton><br>
                    <LiButton class="default-button" @click="step.main.step = 'secret'">秘密基地</LiButton><br>
                    <LiButton class="default-button" @click="step.main.step = 'closet'; sub_step = 'closet_1'">量子衣柜</LiButton><br>
                    <LiButton class="default-button" @click="step.main.step = 'desk'">淡粉色书桌</LiButton><br>
                    <!-- <LiButton class="default-button" @click="step.main.step = '1'">白色毛绒地毯</LiButton><br> -->
                </a-tab-pane>
                <a-tab-pane key="3" title="浴室">
                    <LiButton class="default-button" @click="step.main.step = 'dressing'; sub_step = 'dressing_1'">紧缚化妆台</LiButton><br>
                </a-tab-pane>
            </a-tabs>
        </template>
        <template #right>
            <LiLuoMap />
            <p>充满少女心装饰的卧室，是只属于璃落自己的小小城堡。因为璃落喜欢小而温馨的感觉，整个卧室占地4米x5.5米，只有22平米大小，共分为走廊、牢房和卫生间三部分。其中走廊在房间南部，开着去往牢房的门；牢房和卫生间则分别在牢房西面和东面。</p>
            <p>一进门便是一条1米x5.5米的东西方向走廊：走廊墙壁上挂着许多璃落和笨璃璃们的照片，西侧走廊尽头开着一扇能看到外景窗户，窗下放着鞋柜，鞋柜旁是连接牢房的小门；西侧走廊的南面墙壁上还开着一扇能看到客厅的单向透视窗。</p>
            <p>牢房占地3米x2.5米，四面和屋顶均由坚硬的笼壁围拢而成，地面则铺满白色绒毛地毯。牢房内绝大部分空间被一个上床下桌的2米x2.2米公主床占满，在牢门一侧留下刚好足够璃落通行的空间，方便璃落通过那里的梯子上床以及去往卫生间。</p>
            <p>双人床下方主要由西、北两侧的柜子以及东侧的书桌支撑。西侧柜子分几层，分别放着璃落爱吃的零食、日常用到的杂物以及她的涩涩玩具箱；北侧用来支撑的柜子为阿塔送的量子衣柜。</p>
            <p>璃落主要活动的区域在双人床下方的空间中，这片空间高约一米六，刚好比璃落的稍高。空间中除了用来支撑的柜子与书桌外，还摆放着一个拘束椅，椅子前便是支撑床的淡粉色书桌，璃落工作学习时的必需品。</p>
            <p>卫生间占地3米x2米，地面与墙壁均铺满白色防水瓷砖，只在牢房方向用透明玻璃和无缝玻璃门隔开。卫生间北侧单独分离出一个小隔间，布置有姐姐送的紧缚化妆台，是璃落日常化妆的地方；南侧则以此放置马桶、洗漱池、淋浴喷头以及紧靠南边墙壁的浴缸。</p>
        </template>
    </DomainLayout>


    <!-- 小册子（璃落人设） -->
    <DomainLayout v-if="step.main.step == 'book'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'start'; sub_step = 'start'">其他家具</LiButton><br>
        </template>
        <template #right>
            <p>画外音——</p>
            <p>这是一个安静躺在走廊角落的小册子，外表看上去和那些街边常见的小人书很像，但因为一种神秘的力量，它不会被游戏中的角色发现或触碰。</p>
            <p>翻开小册子，里面记录着这个游戏的主角——璃落的人设：</p>
            <h3>璃落</h3>
            <p>酒红色长发，红色瞳孔，喜穿白色或粉色衣服的女孩。</p>
            <p>性格：极度抖 M 的知名绒布球，无时无刻不想被束缚着。比较顽皮，羞耻心较小的社交恐怖分子。</p>
            <p>喜欢的玩法：轻度气味系、完全拘束、监禁、轻度调教、羞耻调教等。</p>
            <p>背景：20 岁的现缚神领地的小公主。初生于不可考的小国，数年前国家灭亡后由缚神领地代言人璃雪收养为妹妹，因特殊原因失去了来到领地前的大部分记忆。目前在领地常住，有时会接受缚神的安排去往领地外执行任务或探险。</p>
            <p>能力：身负两位缚神的祝福，可在萝莉、少女与成女的身材之间随意转换，不过璃落最原本的，也是大部分时间维持的体型仍是萝莉。</p>
            <DisplayImage
                v-if="store_others.all_images?.liluo_oc1?.src"
                :images="{ src: store_others.all_images.liluo_oc1.src, title: '萝莉体型下的璃落:身高 155 cm，体重 42 kg，三维：B-62A  W-55   H-75。' }"
            /><br><br><br>
            <DisplayImage
                v-if="store_others.all_images?.liluo_oc2?.src"
                :images="{ src: store_others.all_images.liluo_oc2.src, title: '少女体型下的璃落' }"
            /><br><br><br>
            <DisplayImage
                v-if="store_others.all_images?.liluo_oc3?.src"
                :images="{ src: store_others.all_images.liluo_oc3.src, title: '成女体型下的璃落' }"
            /><br><br><br>
        </template>
    </DomainLayout>

    <!-- 照片墙 -->
    <DomainLayout v-if="step.main.step == 'photos'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'start'; sub_step = 'start'">其他家具</LiButton><br>
        </template>
        <template #right>
            <p>走廊一侧的墙壁上挂着一些璃落或笨璃璃的照片，当然，照片中的女孩大多数时候都是被绑着的。</p>
            <a-collapse accordion>
                <a-collapse-item v-for="(item, index) in photos" :key="index" :header="item.name">
                    <h3>
                        {{ item.name }}
                        <LiButton class="default-button" v-if="item.path" @click="clickJump(item.path)">跳转</LiButton><br>
                    </h3>
                    <p v-for="section in splitString(item.content)" :key="section">{{ section }}</p>
                    <DisplayImage :images="item.image" /><br><br>
                </a-collapse-item>
            </a-collapse>
        </template>
    </DomainLayout>

    <!-- 笼内公主床 -->
    <DomainLayout v-if="step.main.step == 'bed'">
        <template #left>
            <LiButton class="default-button" v-if="sub_step == 'bed_1'" @click="bed()">睡个回笼觉</LiButton><br>
            <LiButton class="default-button" v-if="sub_step == 'bed_2'" @click="sub_step = 'bed_3'">惊醒</LiButton><br>
            <LiButton class="default-button" @click="step.main.step = 'start'; sub_step = 'start'">其他家具</LiButton><br>
        </template>
        <template #right>
            <div v-if="sub_step == 'bed_1'">
                <p>年代久远的公主床，似乎在璃落失忆前就跟着她了，但用到现在质量一样坚挺。来到领地后，这张寄托了璃落极大心思的公主床床又经过她多次改造。</p>
                <p>床周围额外添加了笼子，只在床南侧布置上下床梯子的地方安置笼门，笼子的高度刚好够璃落坐起身子。</p>
                <p>璃落一般睡在远离笼门的床里侧，被另一边散落着的各种毛绒玩具挤在角落，再加上床中央摆放的柔软的被卷，让璃落可以惬意地蜷缩在自己小小的一片被窝中。</p>
                <p>另一半床上最显眼的则是一个快比璃落本人都要巨大的黄色鸭梨玩偶，占据了整张床将近四分之一的位置。鸭梨玩偶是沐沐之前送给璃落的，不仅样子可爱，还是一个装满玩具的拘束睡袋，内部携带足够的束缚玩具和维生装置，足以将璃落紧紧团缚后塞进去当填充物。</p>
                <p>笼子顶部挂着一组灯管，在笼门处和枕头处都设置了开关，有夜灯、日光灯、助眠灯、氛围灯等多种模式可供挑选。</p>
                <p>在床挨着笼子的四边都堆着卷好的粉色小被子，让整个床铺看起来更加温馨。这些小被卷中都设置了连接秘密基地内各处储藏地的空间通道，将手伸进软软的被子中便可以方便的取用藏在秘密基地中的道具。</p>
                <p>上侧的被卷中可以拿出控制公主床功能的遥控器；脚下的被卷中则可以从床下衣柜中拿出各种衣服；靠近笼门一侧的被卷连接着秘密基地中放满小吃和水的零食箱；而璃落睡觉一侧的被卷也可以拿出秘密基地内的各类道具。</p>
                <p>遥控器可以将床周围的笼子内壁填满柔软的海绵，变成隐私感足足的海绵牢房；也可以将床尾的投影幕布放下，靠在床上方便地看电影。</p>
                <p>没有其他事情要做时，璃落经常喜欢在床上宅一天，多功能的公主床足以满足她的所有日常需要。</p>
            </div>
            <div v-if="sub_step == 'bed_2'">
                <h3>梦中的被子娘</h3>
                <p>从床尾笼子开启的小口爬上床，搂着心爱的皮卡丘毛绒玩偶，璃落很快便进入了梦乡……</p>
                <p v-for="section in current_dream" :key="section">{{ section }}</p>
            </div>
            <div v-if="sub_step == 'bed_3'">
                <p>“唔……好奇怪的梦啊……”璃落晃了晃脑袋，她刚刚好像梦到被子成精在玩弄自己，真是奇事。</p>
                <p>清醒了一些后，璃落离开软软的被子，下床继续去忙了，然而她不知道的是，在她转身后，床上还未叠起的被子慢慢隆起了一个娇小的人形……</p>
            </div>
        </template>
    </DomainLayout>

    <!-- 秘密基地 -->
    <DomainLayout v-if="step.main.step == 'secret'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'start'; sub_step = 'start'">其他家具</LiButton><br>
        </template>
        <template #right>
            <p>璃落公主床的内侧有着一个只能刚刚好容纳她趴着出去的小窗口，可通往一座只属于璃落的秘密基地。</p>
            <p>可能是因为丢失了不少记忆，璃落经常会感到不安，因此霏羽姐姐送了她这个带有折叠空间的秘密基地，这个独属于璃落的小空间足以填补她内心缺失的安全感。</p>
            <p>秘密基地位于一个独立的空间中，其内部填充满了一个巨大的比璃落身材大数十倍的被子卷，是的，就是一个巨大的折叠起来的棉花被。因此整个秘密基地主要分为两层，分别对应被卷的上夹层和下夹层。进入秘密基地后会自动传送至棉花被的下方夹层中。由于松软的棉花填充了整个空间，璃落进入后周身都会被柔软的触感所包裹，仿佛置身于晒了一天的散发着阳光味道的被窝中，这种独特的触感也是璃落对这个秘密基地最满意的地方。</p>
            <p>因为环境狭小且周围挤压着棉花，秘密基地中大部分地方是没有光线的，不过早已熟悉这里环境的璃落完全可以摸黑找到路，且在传送入口处配有手电筒，足以照亮狭小的空间。</p>
            <p>在几个关键的节点处，木质架子支撑起几个存放东西的仓库，璃落积攒的食物和水、珍藏的小玩具、收集的奇珍异物都会保存在这些仓库之中</p>
        </template>
    </DomainLayout>

    <!-- 量子衣柜 -->
    <DomainLayout v-if="step.main.step == 'closet'">
        <template #left>
            <LiButton class="default-button" v-if="sub_step == 'closet_1'" @click="armoire()">进行随机穿搭</LiButton><br>
            <LiButton class="default-button" @click="step.main.step = 'start'; sub_step = 'start'">其他家具</LiButton><br>
        </template>
        <template #right>
            <div v-if="sub_step == 'closet_1'">
                <p>上个生日阿塔喵送的礼物。这个神奇的衣柜除了具有收纳衣服的功能之外，还可以根据衣柜内的物品对使用者自动进行随机搭配。</p>
                <p>当然纯随机的结果就是谁也不知道衣柜选择出来的搭配会是什么神奇的装扮，所以除了偶尔用来坑一下不知道衣柜功能的朋友，璃落自己基本不用这个功能。</p>
            </div>
            <div v-if="sub_step == 'closet_2'">
                <p>“哐当哐当~”衣柜突然开始摇晃起来，即使见过不少次，璃落仍然免不了担心这东西会把自己晃散架了，毕竟它看起来不是那么结实……</p>
                <p>好在猛烈地摇晃很快便停止了，随后柜门突然打开，几只机械手抓着它们“中意”的搭配冲出柜门，开始对璃落打扮起来。</p>

                <p v-for="item in current_clothing" :key="item">{{ item }}</p>

                <p>终于，机械手们完成了对璃落的打扮，纷纷对着她竖了一个大拇指后缩回衣柜，房间内再次安静下来……</p>
                <p>“这都什么乱七八糟的呀。”璃落看着身上五颜六色的衣服和拘束有些无语地吐槽道，虽然绳子绑得都很专业，但是这量子衣柜也太“薛定谔”了一些吧。</p>
            </div>
        </template>
    </DomainLayout>

    <!-- 淡粉色书桌 -->
    <Desk v-if="step.main.step == 'desk'"/>

    <!-- 紧缚化妆台 -->
    <DomainLayout v-if="step.main.step == 'dressing'">
        <template #left>
            <LiButton class="default-button" v-if="sub_step == 'dressing_1'" @click="mirror()">盯着镜面</LiButton><br>
            <LiButton class="default-button" @click="step.main.step = 'start'; sub_step = 'start'">其他家具</LiButton><br>
        </template>
        <template #right>
            <div v-if="sub_step == 'dressing_1'">
                <p>18岁生日时姐姐送的礼物，是姐姐在某次超自然紧缚事件中缴获的战利品，虽然被博士封印了大部分灵性，仍然具有特别的功效。</p>
            </div>
            <div v-if="sub_step == 'dressing_2'">
                <h3>{{ current_bondage.title }}</h3>
                <p>璃落盯着化妆台上的半人镜仔细观察，不一会就感觉眼睛有些酸，她揉了揉眼睛，再看向镜子，发现里面照出来的她是被捆起来的样子。</p>
                <p>还没等璃落反应过来，就感觉眼睛一花……</p>
                <p v-for="section in (current_bondage.content || [])" :key="section">{{ section }}</p>
                <p>璃落在束缚与折磨中慢慢睡了过去，不知过了多久，璃落在自己的公主床上睁开了眼，仿佛刚刚的经历只是一场梦。</p>
            </div>
        </template>
    </DomainLayout>

    <!-- 白色毛绒地毯 -->
    <!-- <div v-if="step.main.step == '1'">
        <h2>白色毛绒地毯</h2>
        <p>附着了被改造后的寄生触手的绒毛地毯，踩在上面会感到轻微的抚摸感，像一种很舒服的按摩。</p>
    </div> -->

</template>

<script setup>
    import Desk from './LiLuo/Desk.vue'
    import { bondage } from './LiLuo/Bondage.js'
    import { photos } from './LiLuo/Photos.js'
    import { dreams } from './LiLuo/Dreams.js'
    import { randomInt, randomElement, splitString, range, clickJump } from '@/utils.js'
    import LiLuoMap from './LiLuo/LiLuoMap.vue'
    import { useUsersStore, useOtherStore } from '@/store/store'

    const store = useUsersStore()
    const store_others = useOtherStore()
    const step = ref(store.game_step.liluo)
    const sub_step = ref() // 子页面标志


    const current_dream = ref([])
    const bed = () => { // 笼内公主床:随机梦境，当前为被子娘的故事
        sub_step.value = 'bed_2'
        current_dream.value = splitString(randomElement(dreams).content)
    }

    const current_clothing = ref([])
    const armoire = () => { // 量子衣柜:组合随机穿搭
        current_clothing.value = []
        sub_step.value = 'closet_2'
        let random_number = 0
        const colors = ['肉色', '白色', '黑色', '灰色', '咖色', '粉色']
        let random_clothing  = ''
        const initRandmClothing = () => {
            current_clothing.value.push(random_clothing)
            random_clothing = ''
        }

        // 内衣裤
        random_number = randomInt(0, 1) 
        const underwear = ['蕾丝', '棉质', '内裤']
        if(random_number) { random_clothing += `机械手们先七手八脚地将璃落扒光，然后为璃落穿上${randomElement(colors)}${randomElement(underwear)}胖次和小背心。` }
        else { random_clothing += `机械手们先七手八脚地将璃落扒光，没有给璃落穿胖次。` }
        initRandmClothing()

        // 外衣
        random_number = randomInt(0, 1) // 上衣
        if(random_number) { random_clothing += `之后给璃落穿上了${randomElement(colors)}T恤，` }
        random_number = randomInt(0, 1) // 裙子
        const skirt = ['短裙', '长裙', '连衣裙']
        if(random_number) { random_clothing += `搭配${randomElement(colors)}的${randomElement(skirt)}，` }
        const socks = ['短棉袜', '小腿袜', '过膝袜', '连裤袜', '踩脚袜'] // 袜子
        const body = ['双手', '双脚']
        random_clothing += `又给璃落的${randomElement(body)}穿上${randomElement(colors)}的${randomElement(socks)}。`
        initRandmClothing()

        // 捆绑
        const bondage_arm = ['五花大绑', '在身后并拢捆缚', '捆成后手观音姿势', '日式紧缚']
        random_clothing += `随后用${randomElement(colors)}绳索将璃落的双手${randomElement(bondage_arm)}，`
        const bondage_leg = ['并拢捆紧', '分别大小腿折叠捆紧']
        random_clothing += `又用${randomElement(colors)}的绳索将璃落的双腿${randomElement(bondage_leg)}，最后连她的手指也不放过，还用${randomElement(colors)}的胶带将她的双手分别包裹成球。`
        initRandmClothing()
    }
    
    const current_bondage = ref({ title: '', content: [] })
    const mirror = () => { // 紧缚化妆台:获得随机紧缚段落
        sub_step.value = 'dressing_2'
        current_bondage.value = randomElement(bondage)
    }

</script>

<style scoped>
    .select {
        width: 80%;
    }
    :deep(.arco-tabs-tab-title) {
        color: white;
        font-size: 18px;
    }
</style>
./LiLuo/Bondage.js
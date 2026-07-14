<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'order' ">点餐</LiButton><br>
            <LiButton class="default-button" @click="step.main.step = 'visit' ">参观</LiButton><br>
        </template>
        <template #right>
            <p>“欢迎来到狐的小酒馆~这里可以自己DIY专属于你自己的饮料哦，酒饮、奶饮、冰激凌都应有尽有！”说话的是一个穿着白色连衣裙的狐耳女孩。</p>
        </template>
    </DomainLayout>

    <!-- 点餐 -->
    <DomainLayout v-if="step.main.step == 'order'">
        <template #left>
            <h3>底料选择</h3>
            <a-select class="select" v-model="base_material_value" @change="changeIntrocudtion(1)" placeholder="请选择底料……">
                <a-option v-for="item of base_material" :key="item.label" :value="item" :label="item.label" />
            </a-select>
            <h3>辅料选择</h3>

            <p v-if="drink_mode == 0">请在选择主料后再进行辅料选择</p>
            <a-select v-if="drink_mode == 1" class="select" v-model="wine_material_value" @change="changeIntrocudtion(2)" placeholder="请选择辅料……" multiple :allow-search="false">
                <a-option v-for="item of wine_material" :key="item.label" :value="item" :label="item.label" />
            </a-select>
            <a-select v-if="drink_mode == 2" class="select" v-model="milk_material_value" @change="changeIntrocudtion(3)" placeholder="请选择辅料……" multiple :allow-search="false">
                <a-option v-for="item of milk_material" :key="item.label" :value="item" :label="item.label" />
            </a-select>

            <br><br>
            <LiButton class="default-button" @click="clickMake()">开始调制</LiButton><br>
        </template>
        <template #right>
            <p>你接过狐娘递过来的菜单，上面各种饮品配料琳琅满目。</p>
            <h3>材料介绍</h3>
            <div class="introduction">
                <p>{{ material_introduction }}</p>
            </div>
        </template>
    </DomainLayout>
    <DomainLayout v-if="step.main.step == 'drink'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'start' ">酒馆其他项目</LiButton><br>
        </template>
        <template #right>
            <h3>调制饮品</h3>
            <p v-for="item in drink_log" :key="item">{{ item }}</p>
        </template>
    </DomainLayout>

    <!-- 参观 -->
    <DomainLayout v-if="step.main.step == 'visit'">
        <template #left>
            <LiButton class="default-button" v-for="item in drink_text" :key="item" @click="enterStoryLink(item)">{{ item.title }}</LiButton>
            <br>
            <LiButton class="default-button" @click="step.main.step = 'start' ">酒馆其他项目</LiButton>
        </template>
        <template #right>
            <p>跟着狐娘来到参观室，可以看到桌子上摆放了一些样品，旁边用小屏幕分别播放着对应材料的获取过程。</p>
            <p>小酒馆的材料主要由夕押璃公司提供，因此榨取原料的场地都是在公司地牢。</p>
            <p>仔细观察的话，会发现每一个视频中都有披着长袍，穿着灰色小腿袜和运动鞋的白发小萝莉在忙碌，她就是负责收取原料的员工多多。</p>
        </template>
    </DomainLayout>

</template>

<script setup>
    import { randomElement, replaceString, splitString } from '@/utils.js'
    import { drink_text } from '@/assets/TextualData'
    import { useUsersStore } from '@/store/store'
    import { enterStoryLink } from '@/utils'

    let proxy = ref(null)
    onMounted(() => {
        proxy.value = getCurrentInstance().proxy // 代替this时用到，用于arco的message功能
    })

    const store = useUsersStore()
    const step = ref(store.game_step.domain.gourmet_palace.pub)
    const drink_mode = ref(0) // 判断当前底料：0-无；1-梨汁；2-豆奶

    const drink = {
        color: [], // 颜色：每选一种材料就添加一种颜色，最后从列表随机选一种颜色作为最终颜色
        type: '',  // 类型：果酒/烈酒/果奶/冰激凌
        taste_1: '', // 入口口味
        taste_2: '', // 回味
    }

    let material_value = 1
    const base_material_value = ref()
    const wine_material_value = ref()
    const milk_material_value = ref()

    const drink_log = ref([])

    const initDrink = () => { // 初始化数据
        drink.color = []
        drink.type = ''
        drink.taste_1 = ''
        drink.taste_2 = ''
        drink_log.value = []
    }

    // 菜单上的材料列表
    const base_material = [ // 底料
        {
            value: material_value++,
            label: '梨汁',
            introduction: '由醉酒的笨璃璃生产，酒水中最基本的底料，度数不高且入口微甜，适合酒量小的女孩子选择。',
            type: '鸡尾酒',
            taste_1: '入口感觉微甜，'
        },
        {
            value: material_value++,
            label: '璃璃豆奶',
            introduction: '奶制品中最基本的底料，与市面上的牛奶相比奶味更足且多了一些果味。',
            type: '奶饮',
            taste_1: '入口感觉有些甜甜的奶味，'
        }
    ]

    const other_material = [ // 通用辅料
        {
            value: material_value++,
            label: '花露',
            introduction: '由某位花精灵生产，可以给饮品添加百花的清香。',
            color: '大红色',
            taste_1: '闻起来有些许让人舒服的香气，',
            taste_2: '唇齿之间依然留着隐隐的花香，',
        },
        {
            value: material_value++,
            label: '鱼子酱',
            introduction: '由某条深海鲜鱼生产，可以给饮品添加一些大海的风味。',
            color: '深蓝色',
            taste_1: '又掺杂着些许鲜咸的风味，'
        },
        {
            value: material_value++,
            label: '马奶',
            introduction: '特殊口味的奶制品，味道微腥，但回味起来会有难忘的奶香味。经常喝的话可是会上瘾的哦。',
            color: '咖啡色',
            taste_1: '仔细品尝的话可以尝出些许腥味，',
            taste_2: '仍然有淡淡的奶香味久久不散，'
        },
    ]

    const wine_material = [ // 酒类辅料
        {
            value: material_value++,
            label: '魅汁',
            introduction: '由醉酒的魅魔生产，口味辛辣，与其他材料搭配和调制成高烈度酒，但喝过后可能会发情哦。',
            color: '粉红色',
            type: '烈酒',
            taste_1: '紧接着魅魔烈酒特有的烟熏般的风味带着灼热的感觉滑过口腔，',
            taste_2: '你感觉脑袋有些晕晕的，脸颊有些发烫，但仍有一种再来一杯的冲动，'
        }
    ]
    for(let i = 0; i < other_material.length; i++){wine_material.push(other_material[i])}

    const milk_material = [ // 奶类辅料
        {
            value: material_value++,
            label: '狐奶',
            introduction: '充满元素力的奶，与其他原料混合可以制成带有奶味的冰淇淋。',
            color: '淡黄色',
            type: '冰激凌',
            taste_1: '凉凉的冰激凌带着浓郁的奶味在口腔内溢散，甜味的催化下你的心情也跟着upup，'
        },
        {
            value: material_value++,
            label: '魅魔奶',
            introduction: '高卡路里的巧克力味奶品，可以为其他材料添加巧克力风味，但注意加的太多的话可能会发情哦。',
            color: '粉红色',
            taste_1: '还带有些微巧克力的香味，',
            taste_2: '可能是魅魔材料的效果，你感觉脸颊有些发烫，',
        },
    ]
    for(let i = 0; i < other_material.length; i++){milk_material.push(other_material[i])}

    const material_introduction = ref() // 材料介绍栏的内容
    const changeIntrocudtion = (select_mode) => { // 改变材料栏内容，select_mode 确定当前活跃的是哪个材料栏，有1,2,3三种
        let current_material = null
        if(select_mode == 1){
            current_material = base_material_value.value
            drink_mode.value = base_material_value.value.value
        }
        if(select_mode == 2){
            if(wine_material_value.value.length){ current_material = wine_material_value.value[wine_material_value.value.length - 1] }
            else { current_material = base_material_value.value }
        }
        if(select_mode == 3){
            if(milk_material_value.value.length){ current_material = milk_material_value.value[milk_material_value.value.length - 1] }
            else { current_material = base_material_value.value }
        }
        material_introduction.value = current_material.label + ':' + current_material.introduction
    }

    // 开始调制
    const clickMake = () => {
        const makeDrink = (target) => {
            if(target.color) {drink.color.push(target.color)}
            if(target.type) {drink.type = target.type}
            if(target.taste_1) {drink.taste_1 += target.taste_1}
            if(target.taste_2) {drink.taste_2 += target.taste_2}
        }

        initDrink()

        if(drink_mode.value == 0){
            proxy.value._.appContext.config.globalProperties.$message.warning("什么材料都不选怎么调制啊！")
            return
        }
        
        makeDrink(base_material_value.value)

        if(drink_mode.value == 1){
            if(!wine_material_value.value){
                proxy.value._.appContext.config.globalProperties.$message.warning("主料要选，辅料也要选的！")
                return
            }
            for(let i = 0; i < wine_material_value.value.length; i++){
                makeDrink(wine_material_value.value[i])
            }
        }
        if(drink_mode.value == 2){
            if(!milk_material_value.value){
                proxy.value._.appContext.config.globalProperties.$message.warning("主料要选，辅料也要选的！")
                return
            }
            for(let i = 0; i < milk_material_value.value.length; i++){
                makeDrink(milk_material_value.value[i])
            }
        }

        drink_log.value.push(`经过一顿眼花缭乱的操作后，没一会狐狐便递给你一杯${randomElement(drink.color)}的${drink.type}。`)
        drink_log.value.push(`你接过${drink.type}仔细品尝起来，第一口下去，${replaceString(drink.taste_1, drink.taste_1.length - 1, '。')}`)
        if(drink.taste_2){ // 因为可能没有任何回味效果，这里判断一下
            drink_log.value.push(`回味起来，${replaceString(drink.taste_2, drink.taste_2.length - 1, '。')}`)
        }

        step.value.main.step = 'drink'
    }

</script>

<style scoped>
    .introduction {
        width: 95%;
        height: 100px;
        overflow: auto;
        border: solid purple;
    }
    .select {
        width: 80%;
    }
</style>




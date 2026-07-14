<template>
    <div v-if="step.main.step == 'start'">
        <h2>帝国试炼城-营地</h2>
        <p>从传送门走出，璃落来到了一片搭着整齐帐篷的营地中。</p>
        <p>一个白发红瞳的大姐姐迎上来，是邪神降临事件中有过一面之缘的奈亚子姐姐，“欢迎来到试炼城营地，我的小可爱……前面就是帝国试炼城了哦~”</p>
        
        <br><br>
        <a-tabs default-active-key="1" position="left">
            <a-tab-pane key="1" title="走动">
                <LiButton class="default-button" @click="clickStart()">开启试炼</LiButton><br>
                <LiButton class="default-button" @click="step.main.step = 'illustrated'">敌人图鉴</LiButton><br>
                <LiButton class="default-button" @click="step.main.step = 'car_shop'">户外车辆店</LiButton><br>
            </a-tab-pane>
            <a-tab-pane key="2" title="闲聊">
                <LiButton class="default-button" @click="step.main.step = 'talk1'">关于帝国试炼城</LiButton><br>
                <LiButton class="default-button" @click="step.main.step = 'talk2'">如何进行试炼</LiButton><br>
                <LiButton class="default-button" @click="step.main.step = 'talk3'">试炼中可能遇到什么</LiButton><br>
            </a-tab-pane>
        </a-tabs>
    </div>

    <Main v-if="step.main.step == 'main'" />
    <Illustrated v-if="step.main.step == 'illustrated'"/>
    <CarShop v-if="step.main.step == 'car_shop'"/>

    <div v-if="step.main.step == 'talk1'">
        <h2>关于帝国试炼城</h2>
        <p>“你问这座试炼城呀，顾名思义咯，是穆妮卡帝国用魔法计算机收集全国信息并模拟场景考验试炼者的地方，原本用于战时选拔人才。”</p>
        <p>“随着这些年帝国周边的环境逐渐安定下来，试炼城也推出了更面向大众的娱乐模式，不仅大大简化了难度，还会根据冒险者的性格模拟敌人和事件，可以说基本变成了新手冒险者们练手的地方了。”</p>
    </div>

    <div v-if="step.main.step == 'talk2'">
        <h2>如何进行试炼</h2>
        <p>简单呀，玩过电子游戏吗？试炼模式大概就和你们的肉鸽类游戏差不多，试炼中分成不同房间，每个房间会遇到不同事件或敌人。</p>
        <p>着重说一下试炼前可以准备的东西吧，看到那边那几个帐篷了吗？那里就是卖相关装备的，你可以在这里买到探险需要的载具。</p>
        <p>载具可以帮你抵挡一些伤害【护盾】、帮你携带更多道具和队友、可以让你用营地买到的材料做饭【回血】、甚至可以让你在载具里休息【回蓝】。</p>
        <!-- <p>刚刚说到了队友，现在最常见的就是帝国培育的植物伙伴了吧，有空你也可以去领地里面的植物园领几只试试。</p> -->
        <p>当然了，营地商店里面的东西都需要用帝国的通用的货币【帝国金币】购买，开始时候不用强求通关，多去打几次应该就有了。</p>
        <p>最后提示一句，在这里买到的东西在所有野外探险时候都可以用的哦~</p>
    </div>

    <div v-if="step.main.step == 'talk3'">
        <h2>试炼中可能遇到什么</h2>
        <p>“小可爱进去的话，遇到的怪物大概都是各种捆绑怪兽吧……不过反正都是模拟出来的，不会有什么危险。”</p>
        <p>“哦对了，里面发生的事情毕竟是根据小可爱的经历模拟的，所以只会出现小可爱曾经见过的怪物哦。”</p>
        <p>“所以，试炼城只是探险的起点，想见到帝国更多风景的话，不妨准备充分后去其他地方看看吧。”</p>
    </div>

    <LiButton class="return-button" v-if="step.main.step != 'start' && step.return_button" @click="clickReturn()">返回营地</LiButton><br>
</template>

<script setup>
    import Main from '@/components/Empire/TrialsCity/Main.vue'
    import CarShop from '@/components/Empire/TrialsCity/CarShop.vue'
    import Illustrated from '@/components/Empire/TrialsCity/Illustrated.vue'
    import { useUsersStore } from '@/store/store'
    import { enterField, leaveField } from '@/components/FieldData/FieldUtils'

    const store = useUsersStore()
    const step = ref(store.game_step.empire.trials_city)

    const clickStart = () => {
        step.value.main.step = 'main'
        store.game_step.empire.main.return_button = false
        enterField()
    }
    const clickReturn = () => {
        step.value.main.step = 'start'
        store.game_step.empire.main.return_button = true
        leaveField()
    }

</script>

<style scoped>
    :deep(.arco-tabs-tab-title) {
        color: white;
        font-size: 18px;
    }
</style>




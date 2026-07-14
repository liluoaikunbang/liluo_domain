<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <LiButton class="default-button" v-for="item in settings" :key="item" @click="step.main.step = item.name; setting_item = item ">{{ item.name }}</LiButton>
        </template>
        <template #right>
        </template>
    </DomainLayout>

    <template v-else>
        <DomainLayout>
            <template #left>
                <LiButton class="default-button" @click="step.main.step = 'start'">其他设定</LiButton>
                <template v-if="setting_item.relate.length">
                    <h3>关联词条</h3>
                    <div v-if="setting_item.relate.length">
                        <LiButton class="default-button" v-for="button in setting_item.relate" :key="button" @click="setting_item = settings.filter((item) => { return item.name == button})[0] ">{{ button }}</LiButton>
                    </div>
                </template>
            </template>
            <template #right>
                <h3>{{ setting_item.name }}</h3>
                <p v-for="section in splitString(setting_item.content)" :key="section">{{ section }}</p>
            </template>
        </DomainLayout>
    </template>

</template>

<script setup>
    import { splitString } from '@/utils.js'
    import { useUsersStore } from '@/store/store'

    const store = useUsersStore()
    const step = ref(store.game_step.domain.church.settings)
    const setting_item = ref()

    const settings = [
        {
            name: '穆妮卡帝国',
            content: `
                以两位缚神为主信仰的开明君主制帝国。缚神领地与新缚神领地便是帝国赠与两位缚神的专属领地。
                补1：因帝国以缚神为主要信仰，因此在与紧缚关联密切的涩涩文化的态度上较为开明，只要征得当事人同意，任何涩涩行为都是合法的，包括开设妓院等。
            `,
            relate: []
        },
        {
            name: '缚神领地',
            content: `
            由缚神霏羽建立的城市，领地居民崇尚“自由下的紧缚”，只将紧缚当做生活乐趣而不会对日常生活进行强制规定。
            领地是由穆妮卡帝国国君赠与缚神的自治区域，最初的为一座中型城市大小，后由缚神霏羽用神力建立屏障变为半封闭的小秘境，借助缚神提供的能量以及空间折叠技术，理论上可以延伸出无限的空间供居民们建设。
            由于领地居民大都喜欢捆绑，领地采用半封闭式管理来保障居民安全。只在炊烟小镇处设置了官方出入口，对居民外出不设限制，但除领地居民外每一个进入领地的人都要进行严格检查，确保不会对领地居民造成威胁。
            对领地居民来说，领地只是她们常住的乐园，而对于慕妮卡帝国的绝大多数人来说，这个为缚神单独设立的区域只是一个令人向往的传说。很少有人知道这个神秘的紧缚圣地该如何进入，但帝国中流传着这样一句话：只要你足够变态，整个世界都会为你裂开，即使是缚神也要为你降下目光。
            `,
            relate: ['双缚神', '代理人璃雪']
        },
        {
            name: '新缚神领地',
            content: '由缚神凌薇建立的城市，领地居民崇尚“严厉的绝对紧缚”，将束缚行为和各种严厉规定贯彻到生活的方方面面且乐在其中。',
            relate: ['双缚神', '代理人洛璃']
        },
        {
            name: '双缚神',
            content: '霏羽和凌薇，传说来自某个已不可考的小世界，同时晋升缚神之位。两人互为情侣，关系一直要好，霏羽继承了M向缚神之力，凌薇继承了S向缚神之力。',
            relate: ['缚神领地', '新缚神领地']
        },
        {
            name: '代理人璃雪',
            content: '缚神领地的代理人，掌管缚神领地事务，在璃落来到领地后亲自收养璃落并作为璃落的监护人。性格清冷但不失温柔，据说是两个缚神领地中缚神之下的战力第一人。',
            relate: ['缚神领地']
        },
        {
            name: '代理人洛璃',
            content: '新缚神领地的代理人，掌管新缚神领地的事务，是平行世界的璃落中唯一只有S属性的个体。被召唤来领地后自愿去往新缚神领地，并在短时间内获得了缚神凌薇的青睐，成为新缚神领地的管理者。',
            relate: ['新缚神领地',]
        },
        {
            name: '紧缚币',
            content: `
                饱含了缚神之力的硬币，是缚神领地内的通用流通货币，同时也可以在外出冒险时与其他商人进行交易。
                比较反直觉的是，紧缚币是缚神根据领地成员的受缚或紧缚行为自由下发的，也就是说只要在领地内绑人或者被绑都有可能收获紧缚币。
                这也是领地内不少体验类设施都免费开放且鼓励大家参与的原因。
            `,
            relate: ['缚神领地', '新缚神领地']
        },
        {
            name: '孽欲神教',
            content: `
                万物皆有度，色欲同样需要克制，如若过分依赖色欲带来的快感，被欲望彻底支配灵魂，便会堕入名为孽欲的心魔之中。或彻底被欲望侵蚀，变为失去理智的欲魔；或与孽欲为伍，成为掠夺他人精气满足自身欲望的孽欲教徒。
                孽欲神教，由孽欲教徒们建立的大型宗教，信徒们不择手段地掠夺榨取他人欲望贡献给她们敬仰的孽欲主神，期望以此换取至纯的快感。
                因教徒大多行事放纵，侵略甚至毁灭过多个帝国，因此与大千世界中大部分秩序势力敌对。
                穆妮卡帝国主信仰为紧缚之神，与欲望关联甚多，因此也经常受到孽欲教徒的侵扰，是大千世界中与孽欲神教正面对抗的势力之一。
            `,
            relate: ['双缚神']
        },
    ]

</script>

<style scoped>
</style>
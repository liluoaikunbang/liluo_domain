<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'place' ">触碰地图（进入笨璃璃世界）</LiButton><br>
        </template>
        <template #right>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'place' ">
        <template #left>
            <template v-if="current_place.buttons.length">
                <h3>进行行动</h3>
                <LiButton class="default-button" v-for="button in current_place.buttons" :key="button" @click="button.handle()">{{ button.name }}</LiButton>
            </template>
            <template v-if="current_place.lilis.length">
                <h3>异世故事</h3>
                <LiButton class="default-button" v-for="button in current_place.lilis" :key="button" @click="button.handle()">{{ button.name }}</LiButton>
            </template>
        </template>
        <template #right>
            <h3>{{ current_place.title }}</h3>
            <p v-for="section in splitString(current_place.content)" :key="section">{{ section }}</p>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'story'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'place' ">回到笨璃璃世界</LiButton><br>
        </template>
        <template #right>
            <template v-if="!Array.isArray(current_story)">
                <!-- 如果是单篇故事，则不是列表，直接展示故事，否则展示系列文的按钮，选择对应文章后出现文章 -->
                <DisplayStory :story="current_story" :no_read_page="true" />
            </template>
        </template>
    </DomainLayout>

</template>

<script setup>
    import { useUsersStore } from '@/store/store'
    import { splitString } from '@/utils'
    import { advanture_text } from '@/assets/TextualData.js'
    import DisplayStory from '@/components/base/DisplayStory.vue'

    const store = useUsersStore()
    const step = ref(store.game_step.liluo.stupid_map)

    const places = [
        {
            step_name: 'map',
            title: '笨璃璃世界',
            content: `
            视线模糊了一瞬，璃落只觉得眼前景色突变，转瞬间已经站在了地图内的笨璃璃世界中。她环视四周，发现自己似乎处于一间布置简洁的宾馆客房内。房间内的摆设朴素而不失雅致，仅有的几件家具是一张床、一组木质桌椅，以及一扇看起来经历了岁月侵蚀、显得有些破败的木门。桌上躺着一封信，璃落拾起并打开信件，信纸上是缚神姐姐那手漂亮的字迹，信中简要地介绍了这个世界中笨璃璃们的起源。
            `,
            buttons: [
                {
                    name: '走出房间',
                    handle(){ place_name.value = 'hotel' }
                },
                {
                    name: '查看信件',
                    handle(){ place_name.value = 'note1' }
                },
            ],
            lilis: [],
        },
        {
            step_name: 'note1',
            title: '笨璃璃世界的来历',
            content: `
                信中所述，简而言之：此地的笨璃璃们，为璃落在不同平行世界中的投影，由缚神截取平行世界中笨璃璃们的一缕灵魂切片制作而成，得以实时反馈平行世界中笨璃璃们的状态。
                对于璃落曾亲身涉足或以其他方式见识过的世界线中的个体，她能够通过触碰这些投影，感同身受地回顾她们的故事。然而，对于那些璃落尚未得见的平行世界，她只能通过观察此地的投影，来揣测那些世界中璃落的境遇。
                例如，如果此间的笨璃璃尚能自由行动，说明相应世界中的璃落境况尚好；若笨璃璃的身体已被完全拘束，仅能微弱挣扎，则表明那个世界的璃落可能正面临困境；而倘若笨璃璃不仅身受紧缚还被禁锢于一地，动弹不得，则意味着那个世界的璃落可能已遭遇不幸，其灵魂或许已在紧缚诅咒的作用下，遭受了永恒的囚禁。
                由于缚神的干预，那些被诅咒永久束缚的灵魂将被带回笨璃璃的世界，由其他笨璃璃们照料。虽然失去了自由，但比起被封闭在永不见天日的诅咒空间，这样的结局要好得多。
                若想深入了解笨璃璃的背景设定，可继续往下阅读。
                自出生伊始，每个人都会在无数选择中衍生出众多平行世界，璃落也不例外。这些世界包含科技、魔法等多种可能，而每个世界中都有一个名为璃落的女孩，她们或幸福或艰难地生活着。
                但是，由于紧缚诅咒的作用，所有璃落天生对束缚有着难以言喻的偏好，并在日常生活中更易接触到与之相关的事物。对璃落而言，这或许并非坏事，但紧缚诅咒之所以被称作诅咒，更在于其另一效果：被诅咒者会逐渐与这个世界失去联系，直至陷入一种无人问津、无感无知的状态。
                诅咒实现此目的的途径在于，被诅咒者的平行世界中的个体，会因种种意外或人为事件而过早地非正常死亡。据说，每个个体诞生于世，都带有世界赋予的使命，也就是所谓的命运。有人顺从命运度过一生，完美履行自己的使命；有人逆流而上，虽未完成使命，却也得到世界的认可。但如果有来自世界之外的力量——如诅咒——干预，导致个体以非命运安排的方式提前离世，那么这个世界与个体的联系就会削弱，此时，外部力量便能轻易地将个体的灵魂抽离并囚禁。随着越来越多的平行世界中的个体被囚禁，所有属于该个体的平行世界个体都将受到影响，或被世界所弃而变得极为不幸，或失去世界的庇护，最终被诅咒之力完全吞噬。
                璃落因缚神霏羽的一次实验意外而沾染了紧缚诅咒。缚神霏羽一直在寻求解决的方法，以纠正自己造成的问题。可惜现在仍然没有根除诅咒的办法，所以她为璃落创造了这个世界，使璃落能够随时观察自己平行世界中个体的状态，并在必要时将璃落送入平行世界，帮助那个世界的璃落渡过难关。
            `,
            buttons: [
                {
                    name: '走出房间',
                    handle(){ place_name.value = 'hotel' }
                }
            ],
            lilis: [],
        },
        {
            step_name: 'hotel',
            title: '宾馆大厅',
            content: `
                步出房间，璃落进入了一个充满岁月痕迹的西式宾馆大厅。高挑的天花板上，华丽的吊灯洒下柔和的光线，照亮了磨损的大理石地面。复古的皮质沙发散布在大厅各处，墙上挂着几幅油画，尽管颜色有些褪色，但仍透出昔日的风雅。前台后，一位红发女孩静坐，她身着白色印花连衣裙，搭配着纯白色的裤袜，给人一种清新脱俗的感觉。然而，她的手脚却被一副古旧的镣铐锁住，这似乎暗示着她与这个世界的特殊联系。璃落细致地观察了一番，最终意识到自己无法与这个投影在此的笨璃璃进行直接的互动。
            `,
            buttons: [
                {
                    name: '去往公共浴室',
                    handle(){ place_name.value = 'hotel_bathroom' }
                },
                {
                    name: '去往其他房间',
                    handle(){ place_name.value = 'other_room' }
                },
                {
                    name: '离开宾馆',
                    handle(){ place_name.value = 'town' }
                }
            ],
            lilis: [],
        },

        // 宾馆内部房间
        {
            step_name: 'hotel_bathroom',
            title: '公共浴室',
            content: `
                房间对面是一间公共浴室，但因为宾馆的客房都配备了独立卫浴，这里显得格外冷清。璃落正打算离开，却意外地与一位穿着女仆装的笨璃璃不期而遇。这位女仆尽管戴着手铐脚镣，步伐依旧矫健，璃落没能及时躲避，竟直接穿过了她的身体。这突如其来的穿越让璃落短暂地愣了一下，但很快她便回过神来，跟随女仆小姐在空旷的浴室中移动。
                她们来到了浴室角落的一个小房间，从装饰来看，这里似乎是一个桑拿房。在璃落观察周围环境的同时，女仆小姐已经搀扶着一位满身香汗的女孩从桑拿房走了出来。女孩从脖颈到脚丫均被白色纱布包裹，被汗水洇湿的纱布下还能隐约看到一圈圈绳索的束缚痕迹，让她只能蹦跳着慢慢移动。走出房间后，璃落才看到她的脖子上挂着一个项圈，项圈上的锁链延伸进桑拿房，使她最多只能走到桑拿房门口而无法离开。
                女孩的小嘴上戴着口枷，强迫她的小嘴张到最大，蹦跳间积攒在口中的津液也抑制不住得不断流出……被层层包裹着束缚在闷热的桑拿房中，还被开口器禁锢着不断溢出口水，女孩早就出现了脱水的征兆。
                女仆小姐赶紧扶着她坐在桑拿房门口的椅子上，从挎篮中拿出水杯慢慢喂给女孩。
                “啊~咳咳……”小嘴被迫张开到极限，吞咽困难，女孩经常会被水流呛到。每当这时，女仆都会轻柔地拍打她的背部，帮助她平复呼吸，然后再更加细心地放缓喂水的速度。
                一瓶水喝完，女仆小姐又从挎篮中取出一小碗冰激凌，细心地用小勺挖起，女孩则伸出小巧的舌头，慢慢舔食。冰激凌的甜美味道让女孩的眉头渐渐舒展，看到这一幕，女仆小姐的脸上也露出了温暖的笑容。
            `,
            buttons: [
                {
                    name: '离开浴室',
                    handle(){ place_name.value = 'hotel' }
                },
            ],
            lilis: [
                {
                    name: '触碰女孩（观看平行世界的故事）',
                    handle(){ step.value.main.step = 'story'; current_story.value = advanture_text.before_dream[1] }
                }
            ],
        },
    ]

    const place_name = ref('')
    const current_place = ref(places[0])
    const current_story = ref('')

    watch(() => place_name.value, (source, target) => {
        current_place.value = places.filter((item) => { return item.step_name == place_name.value })[0]
    }, {
        deep: true
    })

</script>

<style scoped>
</style>

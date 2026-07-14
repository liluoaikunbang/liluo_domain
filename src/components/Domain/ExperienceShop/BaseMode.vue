<template>
    <h2>拘束逃脱</h2>
    <div v-show="main_step == 0">
        <p>你的意识逐渐沉入虚拟网络中……</p>
        <p>再次醒来时，入目所见的是一张姣好的面孔，鹅蛋脸型、五官柔和，只可惜凌厉的眼神让她的气质从温柔变成了冷冽。</p>
        <p>“醒了？”清冷的声音将你乱飘的思绪拽了回来，脖颈上冰冷的触感被迫让你接受了当前的处境，你不得不保持安静，先看看她到底要干什么。</p>
        <p>“别紧张嘛。”对方的声音忽然温柔了下来，她未持刀的手轻轻捋着你的头发，但喜怒无常的样子反而更让你紧张。</p>
        <p>在你的注视下，对方终于简单表明了来意，“我只是暂时来这里落个脚，过一会就走，不过这么等着也无聊，不如我们来玩个游戏吧。
            简单来说就是我把你绑起来，然后看你什么时候能挣脱，一直没法逃脱的话可是会有惩罚的哦~”</p>
        <p>你除了答应她之外似乎别无选择……</p>
        <LiButton @click="startClick0()">开始游戏</LiButton>
    </div>
    <div v-show="main_step == 1">
        <p>“嗯……让我想想具体该怎么玩呢，总之你先穿件衣服吧。”绑匪开始翻找起你的衣柜，而脖颈的锋利离开后，终于松了口气的你才发现原来你还赤裸着身体……</p>
        <a-select class="gift-select" v-model="clothing" placeholder="请选择服装……">
            <a-option v-for="item of clothing_list" :key="item.label" :value="item" :label="item.label" />
        </a-select>
        <LiButton class="shop-button" @click="startClick1()">穿上衣服</LiButton>
    </div>
    <div v-show="main_step == 2">
        <p>“这么多玩具，看来平时玩得挺花的呀”刚刚穿好衣服你便听到身后女孩揶揄的声音，转头一看才发现她不知从哪里翻出一堆绳索和小玩具。</p>
        <p>“不过毕竟是借用了你的地方，想要怎么被捆就由你挑选吧。看你的样子也挺M的，要怎么绑，可要 好 好 选啊。”绑匪虽然给了你选择，但明显语带威胁，
            看来不能选择太简单的束缚方式去忽悠她。</p>
        <h3>手臂拘束</h3>
        <a-select class="gift-select" v-model="arm_tie_value" placeholder="请选择拘束具……">
            <a-option v-for="item of arm_tie" :key="item.label" :value="item" :label="item.label" />
        </a-select>
        <h3>眼部拘束</h3>
        <a-select class="gift-select" v-model="eye_tie_value" placeholder="请选择拘束具……" multiple :allow-search="false">
            <a-option v-for="item of eye_tie" :key="item.label" :value="item" :label="item.label" />
        </a-select>
        <h3>嘴部拘束</h3>
        <a-select class="gift-select" v-model="mouth_tie_value" placeholder="请选择拘束具……" multiple :allow-search="false">
            <a-option v-for="item of mouth_tie" :key="item.label" :value="item" :label="item.label" />
        </a-select>
        <h3>手指拘束</h3>
        <a-select class="gift-select" v-model="finger_tie_value" placeholder="请选择拘束具……" multiple :allow-search="false">
            <a-option v-for="item of finger_tie" :key="item.label" :value="item" :label="item.label" />
        </a-select>
        <h3>腿部拘束</h3>
        <a-select class="gift-select" v-model="leg_tie_value" placeholder="请选择拘束具……" multiple :allow-search="false">
            <a-option v-for="item of leg_tie" :key="item.label" :value="item" :label="item.label" />
        </a-select>
        <h3>增加难度</h3>
        <a-select class="gift-select" v-model="other_tie_value" placeholder="请选择拘束具……" multiple :allow-search="false">
            <a-option v-for="item of other_tie" :key="item.label" :value="item" :label="item.label" />
        </a-select>
        <LiButton class="shop-button" @click="startClick2()">开始捆绑</LiButton>
    </div>
    <div v-show="main_step == 3">
        <p>“就这些？行吧，把手被到身后去，要开始绑你了。”</p>
        <p v-for="item of logs" :key="item">{{ item }}</p>
        <LiButton class="shop-button" @click="startClick3()">开始挣扎</LiButton>
    </div>
    <div v-show="main_step == 4">
        <p>“好了，你可以开始挣扎了。记得别花太久时间，不然可是会有惩罚的哦~”说完她便走出了房间。</p>
        <p>虽然不知道她的目的到底是什么，但现在你的主要任务都是想办法让自己逃掉。</p>
        <div class="log-box" id="log_box">
            <p v-for="item of logs" :key="item">{{ item }}</p>
        </div>
        <div v-show="untie_step == 'base'" class="main-buttons">
            <LiButton class="shop-button" @click="clickUntie">挣扎</LiButton>
            <LiButton v-if="explore_flag" class="shop-button" @click="clickExplore">探索</LiButton>
            <LiButton v-else class="shop-button" :disabled="true">探索</LiButton>
            <LiButton v-if="call_flag" class="shop-button" @click="clickCall">呼救</LiButton>
            <LiButton v-else class="shop-button" :disabled="true">呼救</LiButton>
            <LiButton v-if="outside_flag" class="shop-button" @click="clickOutside">外出</LiButton>
            <LiButton v-else class="shop-button" :disabled="true">外出</LiButton>
        </div>
        <div v-show="untie_step == 'untie'" class="untie-buttons">
            <LiButton v-if="liluo_data.tie_eye.value > 0" class="shop-button" @click="clickUntieEye">尝试挣脱眼部拘束</LiButton>
            <LiButton v-else class="shop-button" :disabled="true">尝试挣脱眼部拘束</LiButton>
            <LiButton v-if="liluo_data.tie_mouth.value > 0" class="shop-button" @click="clickUntieMouth">尝试挣脱嘴部拘束</LiButton>
            <LiButton v-else class="shop-button" :disabled="true">尝试挣脱嘴部拘束</LiButton>
            <LiButton v-if="liluo_data.tie_arm.value > 0" class="shop-button" @click="clickUntieArm">尝试挣脱手臂拘束</LiButton>
            <LiButton v-else class="shop-button" :disabled="true">尝试挣脱手臂拘束</LiButton>
            <LiButton v-if="liluo_data.tie_finger.value > 0" class="shop-button" @click="clickUntieFinger">尝试挣脱手指拘束</LiButton>
            <LiButton v-else class="shop-button" :disabled="true">尝试挣脱手指拘束</LiButton>
            <LiButton v-if="liluo_data.tie_leg.value > 0" class="shop-button" @click="clickUntieLeg">尝试挣脱双腿拘束</LiButton>
            <LiButton v-else class="shop-button" :disabled="true">尝试挣脱双腿拘束</LiButton>
            <br>
            <LiButton class="shop-button" @click="clickReturn">返回</LiButton>
        </div>
        <div v-show="untie_step == 'end'" class="end-buttons">
            <LiButton class="shop-button" @click="clickRestart">重新开始</LiButton>
        </div>

        <LiButton class="shop-button" @click="attri_flag = true">查看人物属性</LiButton>
        <a-drawer
            :height="'40%'"
            :visible="attri_flag"
            placement="top"
            @cancel="attri_flag = false"
            :footer="false"
            unmountOnClose
        >
            <template #title>
                人物属性展示
            </template>
            <div v-if="see_flag">
                <p v-for="item in liluo_data.displayAttributes(display_names)" :key="item">{{ item }}</p>
            </div>
            <div v-else>
                <p v-for="item in display_names" :key="item">{{ item + ':***' }}</p>
                <p>由于你的双眼被束缚，因此无法看到自身被缚情况。</p>
            </div>
        </a-drawer>
    </div>
</template>

<script>

import { ref, reactive, toRefs, onMounted, getCurrentInstance } from 'vue'
import { LiluoData, handleSelections, handleRandom } from '@/utils.js'
import lodash from 'lodash'
import LiButton from '../base/LiButton.vue'

export default {
    components: {
        LiButton,
    },
    setup() {
        // 初始化
        let proxy = ref(null)
        onMounted(() => {
            proxy.value = getCurrentInstance().proxy // 代替this时用到，用于arco的message功能
        })

        const updateLogBox = () => { // 更新log窗口，让窗口的滚动条一直在底部
            let log_box = document.getElementById('log_box')
            // await nextTick();
            setTimeout(() => {
                // console.log('内容增加时', log_box.scrollHeight);
                log_box.scrollTop = log_box.scrollHeight;
            }, 20); // 注意这里需要延迟20ms正好可以获取到更新后的dom节点
        }

        // 初始化属性
        const initData = () => {
            // 人物属性
            liluo_data.value = new LiluoData()
            // 其他属性
            const other_data_object = {
                main_step: 0, // 当前剧情位置
                all_step: [], // 已经走过的剧情位置
                untie_step: 'base', // 挣扎过程时显示的按键组 base:主菜单;untie:挣扎菜单;end:结束后的菜单
                see_flag: true, // 是否能看到自身束缚值
                call_flag: true, // 是否能呼救
                explore_flag: true, // 是否能探索
                outside_flag: true, // 是否能外出求救
                current_round: 1, // 当前回合数
                max_round: 20, // 最高回合数，如果没有逃脱则视为失败
                attri_flag: false, // 是否展示人物属性
                display_names: ['眼部束缚值', '嘴部束缚值', '手臂束缚值', '手指束缚值', '腿部束缚值'], // 需要展示的属性的名字
                logs: []
            }
            for(let key in other_data_object){ 
                other_data[key] = other_data_object[key]
            }
        } 

        const liluo_data = ref()
        const other_data = reactive({})
        initData()

        let tie_log = '' // 捆绑时的日志，捆绑后再合并到logs中

        const updateStep = (next_step) => { // 更新剧情位置
            other_data.all_step.push(next_step)
            other_data.main_step = next_step
        }
        

        // 特殊事件列表
        const addFlagEventLog = (event) => { // 特殊事件后在日志区进行提示
            other_data.logs.push(`提示：${event.content}`)
        }

        // handle函数: 根据束缚值确定该事件是否发生；judge函数: 判断该事件是否允许发生
        // 对比较难理解的成对组合进行举例说明，以无法视物-重见光明这一对为例子
        // 窍门:able的初始值只确定第一回合开始前该事件是否可能发生，且handle函数开始处理和judge函数确定可以处理的条件是相反的，只要确定一项另一项可直接推导。
        // 详细理解:
            // 无法视物事件——如果开始时双眼蒙住:第一回合开始前的判定时handle一次，随后judge中将able设置为false确保不会连续进行此事件，满足要求
            // 无法视物事件——如果开始时双眼蒙住:之后的回合中如果双眼被解开，则judge中将able设置为true
            // 无法视物事件——如果开始时双眼蒙住:之后的回合中如果双眼再次被蒙住，则符合handle的判定，再次触发事件，随后judge中将able设置为false，开始循环

            // 无法视物事件——如果开始时双眼自由:第一回合开始前的判定不会触发该事件，直到双眼被束缚后触发事件，进入“如果开始时双眼蒙住”循环

            // 重现光明事件——如果开始时双眼自由:由于初始值的设定，第一回合开始前的判定不触发事件，随后judge会将able设置为false，未改变束缚前不会触发事件
            // 重现光明事件——如果开始时双眼自由:之后的回合中如果双眼被束缚，则judge中将able设置为true
            // 重现光明事件——如果开始时双眼自由:之后的回合中如果双眼再次被解开，则触发事件且able被设置为false，未改变束缚前不会触发事件，开始循环

            // 重现光明事件——如果开始时双眼蒙住:第一回合开始前的判定不会触发该事件，直到双眼束缚被解开后触发事件，并进入“如果开始时双眼自由”循环

        const event_flag = [ // 特殊事件（部位脱缚，获得胜利等），这些事件均只能发生一次。
            // 部位被缚/脱缚事件
            new class {
                constructor() {
                    this.value = 0
                    this.label = '无法视物'
                    this.intro = '无法看到自身的被缚情况'
                    this.content = '你的双眼被蒙住，因此无法看到自身的被缚情况。'
                    this.able = true
                }
                handle() { if(this.able && liluo_data.value.tie_eye.value > 0) { other_data.see_flag = false; addFlagEventLog(this) } }
                judge() { if(liluo_data.value.tie_eye.value <= 0) {this.able = true} else {this.able = false} }
            },
            new class {
                constructor() {
                    this.value = 1
                    this.label = '重见光明'
                    this.intro = '可以看到自己的拘束情况'
                    this.content = '你终于重见光明，现在你可以看到自己的拘束情况。'
                    this.able = false
                }
                handle() { if(this.able && liluo_data.value.tie_eye.value <= 0) { other_data.see_flag = true; addFlagEventLog(this) } }
                judge() { if(liluo_data.value.tie_eye.value > 0) {this.able = true} else {this.able = false} }
            },
            new class {
                constructor() {
                    this.value = 2
                    this.label = '嘴巴被堵'
                    this.intro = '无法呼救'
                    this.content = '你的嘴巴被堵着，因此无法呼救'
                    this.able = true
                }
                handle() { if(this.able && liluo_data.value.tie_mouth.value > 0) { other_data.call_flag = false; addFlagEventLog(this) } }
                judge() { if(liluo_data.value.tie_mouth.value <= 0) {this.able = true} else {this.able = false} }
            },
            new class {
                constructor() {
                    this.value = 3
                    this.label = '挣脱堵嘴'
                    this.intro = '可以呼救'
                    this.content = '你挣脱了堵嘴，现在可以呼救了'
                    this.able = false
                }
                handle() { if(this.able && liluo_data.value.tie_mouth.value <= 0) { other_data.call_flag = true; addFlagEventLog(this) } }
                judge() { if(liluo_data.value.tie_mouth.value > 0) {this.able = true} else {this.able = false} }
            },
            new class {
                constructor() {
                    this.value = 4
                    this.label = '手指被缚'
                    this.intro = '无法探索'
                    this.content = '你的手指被束缚，因此无法探索周围环境。'
                    this.able = true
                }
                handle() { if(this.able && liluo_data.value.tie_finger.value > 0) { other_data.explore_flag = false; addFlagEventLog(this) } }
                judge() { if(liluo_data.value.tie_finger.value <= 0) {this.able = true} else {this.able = false} }
            },
            new class {
                constructor() {
                    this.value = 5
                    this.label = '挣脱手指束缚'
                    this.intro = '可以探索'
                    this.content = '你挣脱了手指的束缚，现在你可以探索周围了。'
                    this.able = false
                }
                handle() { if(this.able && liluo_data.value.tie_finger.value <= 0) { other_data.explore_flag = true; addFlagEventLog(this) } }
                judge() { if(liluo_data.value.tie_finger.value > 0) {this.able = true} else {this.able = false} }
            },
            new class {
                constructor() {
                    this.value = 6
                    this.label = '双腿被缚'
                    this.intro = '无法外出'
                    this.content = '你的双腿被缚，因此无法离开房屋。'
                    this.able = true
                }
                handle() { if(this.able && liluo_data.value.tie_leg.value > 0) { other_data.outside_flag = false; addFlagEventLog(this) } }
                judge() { if(liluo_data.value.tie_leg.value <= 0) {this.able = true} else {this.able = false} }
            },
            new class {
                constructor() {
                    this.value = 7
                    this.label = '挣脱双腿束缚'
                    this.intro = '可以外出'
                    this.content = '你挣脱了双腿的束缚，现在你可以外出求救了。'
                    this.able = false
                }
                handle() { if(this.able && liluo_data.value.tie_leg.value <= 0) { other_data.outside_flag = true; addFlagEventLog(this) } }
                judge() { if(liluo_data.value.tie_leg.value > 0) {this.able = true} else {this.able = false} }
            },

            // 胜利/失败事件
            new class {
                constructor() {
                    this.value = 8
                    this.label = '挣脱手臂'
                    this.intro = '直接胜利'
                    this.content = '经过不懈努力，你挣脱了手臂的束缚，恭喜逃脱成功！'
                    this.able = true
                }
                handle() { if(this.able && liluo_data.value.tie_arm.value <= 0) { this.able = false; other_data.untie_step = 'end'; addFlagEventLog(this) } }
                judge() { this.able = true }
            },
            new class {
                constructor() {
                    this.value = 9
                    this.label = '倒计时结束'
                    this.intro = '逃脱失败'
                    this.content = '你没有在预定回合数内挣脱束缚，本次逃脱失败。'
                    this.able = true
                }
                handle() { if(this.able && other_data.current_round > other_data.max_round) { other_data.untie_step = 'end'; addFlagEventLog(this) } }
                judge() { this.able = true }
            },
        ]

        const handleFlagEvents = () => { // 处理特殊事件，注意先判定是否发生，再判定是否可以发生。具体分析可看特殊事件上的注释
            for(let i = 0; i < event_flag.length; i++) {
                event_flag[i].handle()
                event_flag[i].judge()
            }
        }

        // 普通事件列表
        const addEventLog = (event) => { // 发生事件后在日志区进行提示
            other_data.logs.push(`触发${event.label}事件：${event.content}`)
        }
        const handleEvents = (event_list, event_name) => { // 根据传入的事件列表，按概率触发事件（特殊事件不能使用此函数）
            const new_events = lodash.cloneDeep(event_list) // 后面有暂时删除事件操作，先拷贝原事件列表
            let flag = true
            let event_number = new_events.length
            for(let i = 0; i < event_number; i++) {
                if(new_events[i].able && handleRandom(new_events[i].prob)) { 
                    new_events[i].handle()
                    flag = false
                    if(new_events[i].conflict) { // 如果存在冲突事件，在本次循环的事件列表中删除所有冲突事件事件
                        for(let j = 0; j < new_events[i].conflict.length; j++){
                            new_events.splice(new_events[i].conflict[j], 1)
                        }
                        event_number -= new_events[i].conflict.length // 删除了冲突事件，事件的总数减少了，因此给循环事件列表的次数也减少相应数字。
                    }
                }
            }
            if(flag) { other_data.logs.push(`${event_name}什么事情也没发生。`) } // 如果没发生事件，则给出提示
        }

        // conflict:列表中与该事件冲突的事件的地址组成的列表，发生该事件后冲突的事件将不会发生
        // 注意，冲突事件只写事件列表中编号在该事件后面的，因为已经发生的事件即时冲突了也没法删除，且会出现错误。
        const event_bondage = [ // 捆绑过程中的事件
            new class {
                constructor() {
                    this.value = 0
                    this.label = '扒衣'
                    this.intro = '初始0%概率被绑架者扒光，敏感度+0.2'
                    this.prob = 0
                    this.content = '“穿这么严实干什么？”说话间，绑匪粗暴地将你的衣服扒光，只给你留下了内衣内裤和袜子勉强遮住身体。'
                    this.able = true
                }
                handle() { liluo_data.value.sen.value += 0.2; addEventLog(this) }
            },
            new class {
                constructor() {
                    this.value = 1
                    this.label = '收紧'
                    this.intro = '初始20%概率，无条件收紧绳索，全身紧缚程度x2'
                    this.prob = 20
                    this.content = '触发收紧事件。'
                    this.able = true
                    this.conflict = [2]
                }
                handle() { liluo_data.value.tie_arm.value *= 2; liluo_data.value.tie_eye.value *= 2; liluo_data.value.tie_finger.value *= 2; liluo_data.value.tie_leg.value *= 2; liluo_data.value.tie_mouth.value *= 2; addEventLog(this) }
            },
            new class {
                constructor() {
                    this.value = 2
                    this.label = '粗心'
                    this.intro = '初始20%概率，无条件收紧绳索，全身紧缚程度减半'
                    this.prob = 20
                    this.content = '绑架者有些粗心。'
                    this.able = true
                }
                handle() { liluo_data.value.tie_arm.value /= 2; liluo_data.value.tie_eye.value /= 2; liluo_data.value.tie_finger.value /= 2; liluo_data.value.tie_leg.value /= 2; liluo_data.value.tie_mouth.value /= 2; addEventLog(this) }
            },
        ]

        const event_untie = [ // 挣扎过程中的事件
            new class {
                constructor() {
                    this.value = 0
                    this.label = '萌化'
                    this.intro = '绑架者忍不住与你贴贴，强制达到高潮。'
                    this.prob = 0
                    this.content = '你挣扎的样子太可爱了，绑匪女孩忍了又忍，还是没有忍住和你贴贴的欲望。在她娴熟的挑逗下你很快便达到了高潮。'
                    this.able = true
                }
                handle() { liluo_data.value.pleasure.value += 1000; addEventLog(this) }
            },
            new class {
                constructor() {
                    this.value = 1
                    this.label = '挠痒'
                    this.intro = '初始概率10%，快感+20，体力-10'
                    this.prob = 20
                    this.content = '初始概率10%，快感+20，体力-10'
                    this.able = true
                }
                handle() { liluo_data.value.pleasure.value += 20; liluo_data.value.vit.value -= 10; addEventLog(this) }
            },
        ]

        const event_call = [ // 呼救过程中的事件
            new class {
                    constructor() {
                        this.value = 0
                        this.label = '惊动'
                        this.intro = '初始概率20%，嘴部拘束值+50'
                        this.prob = 20
                        this.content = '你的呼救声惊动了绑匪，你的嘴又被堵了起来。'
                        this.able = true
                        this.conflict = [1]
                    }
                    handle() { liluo_data.value.changeTie(0, 50, 0, 0, 0); addEventLog(this) }
                },
            new class {
                constructor() {
                    this.value = 1
                    this.label = '获救'
                    this.intro = '初始概率10%，直接获胜'
                    this.prob = 10
                    this.content = '你的呼救声引来了热心的路人，你成功获救。'
                    this.able = true
                }
                handle() {  other_data.untie_step = 'end'; addEventLog(this) }
            },
        ]

        const event_explore = [ // 探索过程中的事件
            new class {
                constructor() {
                    this.value = 0
                    this.label = '找到小刀'
                    this.intro = '手臂，手指，双腿脱缚能力+10'
                    this.prob = 30
                    this.content = '你找到了小刀，手臂、手指和双腿的脱缚能力增强'
                    this.able = true
                }
                handle() { liluo_data.value.changeUntie(0, 0, 10, 10, 10); addEventLog(this) }
            },
            new class {
                constructor() {
                    this.value = 1
                    this.label = '玻璃碴'
                    this.intro = '手臂，手指脱缚能力减半'
                    this.prob = 30
                    this.content = '探索过程中你不慎被地上的碎玻璃划伤手指，手臂和手指的脱缚能力降低。'
                    this.able = true
                }
                handle() { liluo_data.value.untie_arm.value /= 2; liluo_data.value.untie_finger.value /= 2; addEventLog(this) }
            },
            new class {
                constructor() {
                    this.value = 2
                    this.label = '被察觉'
                    this.intro = '手指束缚+30'
                    this.prob = 30
                    this.content = '绑匪发现了你的小动作，用胶带将你的手指束缚了起来'
                    this.able = true
                }
                handle() { liluo_data.value.changeTie(0, 0, 0, 30, 0); addEventLog(this) }
            },
        ]

        const event_outside = [ // 外出过程中的事件
            new class {
                    constructor() {
                        this.value = 0
                        this.label = '被卖'
                        this.intro = '初始概率20%，嘴部拘束值+50'
                        this.prob = 20
                        this.content = '你向路过的路人求救，但被黑心的路人直接带走，两天后，你在地下拍卖会上被卖给了一个神秘人，你不知道你之后的命运会怎么样。'
                        this.able = true
                        this.conflict = [1]
                    }
                    handle() { other_data.untie_step = 'end'; addEventLog(this) }
                },
            new class {
                constructor() {
                    this.value = 0
                    this.label = '获救'
                    this.intro = '初始概率10%，直接获胜'
                    this.prob = 10
                    this.content = '你向路人求救，热心的路人成功将你救了出来。'
                    this.able = true
                }
                handle() { other_data.untie_step = 'end'; addEventLog(this) }
            },
        ]

        // 服装
        const clothing = ref() // 已选中的服装
        const clothing_list = [ // 服装列表
            {
                value: 0,
                label: '可爱的jk制服',
                intro: '萌化事件概率增加50%，扒衣事件概率增加30%',
                handle() { event_bondage[0].prob += 30; event_untie[0].prob += 50 }
            },
            {
                value: 1,
                label: '保守的女仆装',
                intro: '萌化事件概率增加20%，扒衣服事概率增加50%',
                handle() { event_bondage[0].prob += 50; event_untie[0].prob += 20 }
            },
        ]

        // 拘束具列表
        const addTieLog = (tie) => {
            tie_log += `${tie.content}`
        }

        const eye_tie_value = ref(), mouth_tie_value = ref(), arm_tie_value = ref(), finger_tie_value = ref(), leg_tie_value = ref(), other_tie_value = ref()
        const eye_tie = [ // 眼部拘束
            new class {
                constructor() {
                    this.value = 0
                    this.label = '眼罩'
                    this.intro = '眼部拘束值+30'
                    this.content = '眼部拘束值+30'
                }
                handle() { liluo_data.value.changeTie(30, 0, 0, 0, 0); addTieLog(this) }
            },
            new class {
                constructor() {
                    this.value = 1
                    this.label = '黯淡的美瞳'
                    this.intro = '眼部拘束值+30'
                    this.content = '眼部拘束值+30'
                }
                handle() { liluo_data.value.changeTie(30, 0, 0, 0, 0); addTieLog(this) }
            },
        ]
        const mouth_tie = [ // 嘴部拘束
            new class {
                constructor() {
                    this.value = 0
                    this.label = '袜子塞嘴'
                    this.intro = '嘴部拘束值+10'
                    this.content = '嘴部拘束值+10'
                }
                handle() { liluo_data.value.changeTie(0, 10, 0, 0, 0); addTieLog(this) }
            },
            new class {
                constructor() {
                    this.value = 1
                    this.label = '胶带封嘴'
                    this.intro = '嘴部拘束值+20'
                    this.content = '嘴部拘束值+20'
                }
                handle() { liluo_data.value.changeTie(0, 20, 0, 0, 0); addTieLog(this) }
            },
        ]
        const arm_tie = [ // 手臂拘束
            new class {
                constructor() {
                    this.value = 0
                    this.label = '日式紧缚'
                    this.intro = '手臂拘束值+40'
                    this.content = '手臂拘束值+40'
                }
                handle() { liluo_data.value.changeTie(0, 0, 40, 0, 0); addTieLog(this) }
            },
            new class {
                constructor() {
                    this.value = 1
                    this.label = '五花大绑'
                    this.intro = '手臂拘束值+60'
                    this.content = '手臂拘束值+60'
                }
                handle() { liluo_data.value.changeTie(0, 0, 60, 0, 0); addTieLog(this) }
            },
            new class {
                constructor() {
                    this.value = 2
                    this.label = '后手观音'
                    this.intro = '手臂拘束值+100'
                    this.content = '手臂拘束值+100'
                }
                handle() { liluo_data.value.changeTie(0, 0, 100, 0, 0); addTieLog(this) }
            },
        ]
        const finger_tie = [ // 手指拘束
            new class {
                constructor() {
                    this.value = 0
                    this.label = '袜子包手'
                    this.intro = '手指拘束值+10'
                    this.content = '手指拘束值+10'
                }
                handle() { liluo_data.value.changeTie(0, 0, 0, 10, 0); addTieLog(this) }
            },
            new class {
                constructor() {
                    this.value = 1
                    this.label = '胶带包手'
                    this.intro = '手指拘束值+30'
                    this.content = '手指拘束值+30'
                }
                handle() { liluo_data.value.changeTie(0, 0, 0, 30, 0); addTieLog(this) }
            },
            new class {
                constructor() {
                    this.value = 2
                    this.label = '皮革束手套'
                    this.intro = '手指拘束值+100'
                    this.content = '手指拘束值+100'
                }
                handle() { liluo_data.value.changeTie(0, 0, 0, 100, 0); addTieLog(this) }
            },
        ]
        const leg_tie = [ // 双腿拘束
            new class {
                constructor() {
                    this.value = 0
                    this.label = '捆绑脚踝'
                    this.intro = '双腿拘束值+50'
                    this.content = '双腿拘束值+50'
                }
                handle() { liluo_data.value.changeTie(0, 0, 0, 0, 50); addTieLog(this) }
            },
            new class {
                constructor() {
                    this.value = 1
                    this.label = '捆绑膝盖上下'
                    this.intro = '双腿拘束值+30'
                    this.content = '双腿拘束值+30'
                }
                handle() { liluo_data.value.changeTie(0, 0, 0, 0, 30); addTieLog(this) }
            },
            new class {
                constructor() {
                    this.value = 2
                    this.label = '捆绑大腿'
                    this.intro = '双腿拘束值+10'
                    this.content = '双腿拘束值+10'
                }
                handle() { liluo_data.value.changeTie(0, 0, 0, 0, 10); addTieLog(this) }
            },
        ]
        const other_tie = [ // 增加难度

        ]


        // 0——背景引入
        const startClick0 = () => {
            updateStep(other_data.main_step + 1)
        }
        
        // 1——服装选择
        const startClick1 = () => {
            if(clothing.value) { 
                clothing.value.handle() 
            }
            else { 
                proxy.value._.appContext.config.globalProperties.$message.warning("喂！你想光着身子被绑吗？")
                return
            }
            updateStep(other_data.main_step + 1)
        }


        // 2——捆绑方式选择
        const startClick2 = () => {
            if(!arm_tie_value.value) { // 至少手臂需要被束缚
                proxy.value._.appContext.config.globalProperties.$message.warning("不绑双手的话，绑匪肯定不会答应的吧……")
                return
            }

            handleSelections(eye_tie_value.value)
            handleSelections(mouth_tie_value.value)
            arm_tie_value.value.handle() // 手臂拘束为单选，因此直接取值进行处理即可
            handleSelections(finger_tie_value.value)
            handleSelections(leg_tie_value.value)

            other_data.logs.push(tie_log)
            handleEvents(event_bondage, '捆绑过程')

            updateStep(other_data.main_step + 1)
        }

        // 3——捆绑过程

        const startClick3 = () => {
            handleFlagEvents() // 捆绑后，对特殊事件进行判断
            updateStep(other_data.main_step + 1) // 更新页面
            updateLogBox() // 将日志区的滚动条拉到最下面
        }

        // 4——挣扎过程
        const roundBefore = () => { // 每回合开始前的操作
            other_data.logs.push(`当前第${other_data.current_round}回合。`)
        }
        const roundAfter = () => { // 每回合结束后的操作
            other_data.current_round += 1
            liluo_data.value.fixTie()
            handleFlagEvents() // 对特殊事件进行判断
            updateLogBox() // 将日志区的滚动条拉到最下面
        }

        const clickUntie = () => {
            other_data.untie_step = 'untie'
        }
        const clickUntieEye = () => {
            roundBefore()

            liluo_data.value.tie_eye.value -= liluo_data.value.untie_eye.value
            other_data.logs.push(`你努力挣扎，希望摆脱眼部束缚。`)

            handleEvents(event_untie, '本回合挣扎时')
            roundAfter()
        }
        const clickUntieMouth = () => {
            roundBefore()
            
            liluo_data.value.tie_mouth.value -= liluo_data.value.untie_mouth.value
            other_data.logs.push(`你努力挣扎，希望摆脱嘴部束缚。`)

            handleEvents(event_untie, '本回合挣扎时')
            roundAfter()
        }
        const clickUntieArm = () => {
            roundBefore()

            liluo_data.value.tie_arm.value -= liluo_data.value.untie_arm.value
            other_data.logs.push(`你努力挣扎，希望摆脱手臂束缚。`)

            handleEvents(event_untie, '本回合挣扎时')
            roundAfter()
        }
        const clickUntieFinger = () => {
            roundBefore()

            liluo_data.value.tie_finger.value -= liluo_data.value.untie_finger.value
            other_data.logs.push(`你努力挣扎，希望摆脱手指束缚。`)

            handleEvents(event_untie, '本回合挣扎时')
            roundAfter()
        }
        const clickUntieLeg = () => {
            roundBefore()

            liluo_data.value.tie_leg.value -= liluo_data.value.untie_leg.value
            other_data.logs.push(`你努力挣扎，希望摆脱双腿束缚。`)

            handleEvents(event_untie, '本回合挣扎时')
            roundAfter()
        }
        const clickReturn = () => {
            other_data.untie_step = 'base'
        }

        const clickExplore = () => {
            roundBefore()

            other_data.logs.push(`你努力探索周围，试图发现能帮助你逃脱的道具。`)
            handleEvents(event_explore, '本次探索过程')
            roundAfter()
        }

        const clickCall = () => {
            roundBefore()

            other_data.logs.push(`你努力呼救，试图得到救援。`)
            handleEvents(event_call, '本次呼救')
            roundAfter()
        }

        const clickOutside = () => {
            roundBefore()

            other_data.logs.push(`你挣扎着站起身走到了院子里，希望遇到路过的路人。`)
            handleEvents(event_outside, '你在院子里')
            roundAfter()
            if(other_data.untie_step != 'end'){ // 如果本次外出行为没结束游戏，则会被挪进屋子，下次触发外出事件需要继续点击外出选项。
                other_data.logs.push(`随后你被绑匪再次拽进了房间。`)
            }
        }

        const clickRestart = () => { // 重新开始
            // 属性初始化
            initData()
            // 回到开始界面
            updateStep(0)
        }

        
        return {
            liluo_data, ...toRefs(other_data),
            startClick0, 
            startClick1, clothing, clothing_list,
            startClick2, startClick3,
            eye_tie_value, mouth_tie_value, arm_tie_value, finger_tie_value, leg_tie_value, other_tie_value,
            eye_tie, mouth_tie, arm_tie, finger_tie, leg_tie, other_tie,
            clickUntie, clickUntieEye, clickUntieMouth, clickUntieArm, clickUntieFinger, clickUntieLeg, clickReturn,
            clickExplore, clickCall, clickOutside, 
            clickRestart,
        }
    }
}

</script>


<style scoped>
    .gift-select {
        width: 80%;
    }
    .shop-button {
        margin: 20px 10px 0 10px;
    }
    .log-box {
        width: 100%;
        height: 30vh;
        overflow: auto;
        border: 3px solid pink;
        border-radius: 5px;
    }
</style>



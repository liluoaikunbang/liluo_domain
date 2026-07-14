import lodash from 'lodash'
import pinyin from 'pinyin'
import { useUsersStore, useOtherStore } from './store/store'
import { base_value } from './components/Index/GameStep'
import router from './router'

export class LiluoData { // 人物属性
    constructor() {
        // 基本属性
        this.untie_eye = {name: '眼部脱缚能力值', value: 10} 
        this.untie_mouth = {name: '嘴部脱缚能力值', value: 10} 
        this.untie_arm = {name: '手臂脱缚能力值', value: 10} 
        this.untie_finger = {name: '手指脱缚能力值', value: 10}  
        this.untie_leg = {name: '腿部脱缚能力值', value: 10}
        this.sen = {name: '敏感度', value: 1}
        this.vit = {name: '体力', value: 100}
        this.outsight = {name: '探索能力', value: 50}
        // 状态值
        this.pleasure = {name: '快感槽（%）', value: 50}
        this.tie_eye = {name: '眼部束缚值', value: 0}
        this.tie_mouth = {name: '嘴部束缚值', value: 0}
        this.tie_arm = {name: '手臂束缚值', value: 0}
        this.tie_finger = {name: '手指束缚值', value: 0}
        this.tie_leg = {name: '腿部束缚值', value: 0}
    }
    changeUntie(eye, mouth, arm, finger, leg) { // 修改脱缚能力值，顺序为眼、嘴、手、指、腿
        this.untie_eye.value += eye
        this.untie_mouth.value += mouth
        this.untie_arm.value += arm
        this.untie_finger.value += finger
        this.untie_leg.value += leg
    }
    changeTie(eye, mouth, arm, finger, leg) { // 修改束缚值，顺序为眼、嘴、手、指、腿
        this.tie_eye.value += eye
        this.tie_mouth.value += mouth
        this.tie_arm.value += arm
        this.tie_finger.value += finger
        this.tie_leg.value += leg
    }
    fixTie() { // 修正束缚值，小于0的设置为0
        if(this.tie_eye.value < 0) { this.tie_eye.value = 0 }
        if(this.tie_mouth.value < 0) { this.tie_mouth.value = 0 }
        if(this.tie_arm.value < 0) { this.tie_arm.value = 0 }
        if(this.tie_finger.value < 0) { this.tie_finger.value = 0 }
        if(this.tie_leg.value < 0) { this.tie_leg.value = 0 }
    }
    displayAttributes(display_name_list) { // 根据输入的列表展示部分人物属性
        const display_list = []
        for(let item in this){
            if(display_name_list.includes(this[item].name)) {
                display_list.push(`${this[item].name}:${this[item].value}`)
            }
        }
        return lodash.cloneDeep(display_list) // 因为可能多次调用该函数，为防止再次调用时取到同一个地址，在最后复制一个新数组返回
    }
}

export const scrollWindow = (type) => { // 跳转至页面顶部或底部
    setTimeout(() => {
        if(type == 'top') {
            window.scrollTo(0, 0)
        }
        else if(type == 'bottom'){
            window.scrollTo(0, document.documentElement.offsetHeight)
        }
    }, 10);
}


export const handleSelections = (selection_values) => { // 处理选择器中选中的内容，处理方式遵循选项列表中的handle()函数
    if(selection_values) {
        for(let i = 0; i < selection_values.length; i++) {
            selection_values[i].handle()
        }
    }
}

export const range = (min, max) => { // 类似Python中的range函数，前包后不包
    const answer = []
    for(let i = 0; i < max - min; i++){
        answer.push(min + i)
    }
    return answer
}

export const randomInt = (min_value, max_value) => { // 得到min与max之间的随机数，包括min和max
    let min = Math.ceil(min_value);
    let max = Math.floor(max_value);
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export const randomElement = (list) => { // 从数组中取得随机元素
    return list[randomInt(0, list.length - 1)]
}

export const handleRandom = (prob) => { // 根据概率得到本次该事件是否发生。
    const random_number = randomInt(1, 100) // 得到一个1-100之间的随机数字
    if(random_number >= 1 && random_number <= prob) { return true } // 如果随机数在1-prob之间则代表事件发生
    else { return false } // 否则认为事件没有发生
}

export const splitString = (value) => { // 将多行字符串转化为列表，每行为列表中的一个元素
    if(!value) {return ''}
    // console.log(value)
    let code = value.split(/[(\r\n)\r\n]+/); // 根据换行或者回车进行识别
    // 删除空项和去掉空格。删除空项的时候会改变列表，因此单独循环一次。
    for(let index = 0; index < code.length; index++) {  // 删除空项和只有空格的项
        if (!code[index].replace(/\s*/g, '')) { code.splice(index, 1) }
    }
    // for(let index = 0; index < code.length; index++) {  // 去掉空格
    //     code[index] = code[index].replace(/\s*/g, '')
    // }
    code = Array.from(new Set(code)); // 去重
    return code
}

export const replaceString = (str, index, new_char) => { // 替换字符串中某个位置的字符
    if(!str){ return '' }

    str = str.replace(/\s*/g, '') // 去掉空格

    const target_list = str.split('')
    target_list[index] = new_char
    return target_list.join('')
}

export const pushArray = (old_array, new_array) => { // 将新数组逐一添加到原数组之后，直接改变数组。
    if(!new_array){ return }
    for(let i = 0; i < new_array.length; i++){
        old_array.push(new_array[i])
    }
}

export const findClassFromName = (name_list, all_list) => { // 根据名称列表找出类组成列表
    const thing_list = []
    for(let i = 0; i < name_list.length; i++){
        thing_list.push(all_list.filter((item) => { return item.name == name_list[i] })[0])
    }
    return thing_list
}

export const clickJump = (step_list) => { // 跳转到对应页面的按钮
    if(!step_list || !step_list.length) {
        router.push({
            path: `/${base_value}`
        })
    } else if(step_list[0] == 'base') { // 这种情况下代表没有正式进入游戏，需要跳转到开始游戏前的几个按钮界面
        router.push({
            path: `/${step_list.splice(1, step_list.length - 1).join('/')}`
        })
    } else {
        router.push({
            path: `/${base_value}/${step_list.join('/')}`
        })
    }
}

export const concatList = (lists) => { // 将又列表组成的若干列表拼接为一个列表，即给列表降维。
    const new_list = []
    for(let i = 0; i < lists.length; i++){
        for(let j = 0; j < lists[i].length; j++){
            new_list.push(lists[i][j])
        }
    }
    return new_list
}

function convertChineseToPinyin(chineseText) {
    // 使用pinyin库将中文转换为拼音数组
        const pinyinArray = pinyin(chineseText, {
            // 配置选项，style可以指定返回的拼音风格
            style: pinyin.STYLE_NORMAL,
        });
    
        // 将数组中的拼音拼接成一个字符串
        return pinyinArray.join('-');
    }

export const enterStoryLink = (story) => {
    const store_others = useOtherStore()
    store_others.current_story = story
    const full_path = router.currentRoute.value.fullPath

    router.push(`${full_path}/${convertChineseToPinyin(story.title)}`)
}

















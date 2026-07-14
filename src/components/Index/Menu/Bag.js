import { Message } from '@arco-design/web-vue';
import { role_skills } from '../../Domain/FieldData/RoleSkills'

class MemoryBase {
    constructor() {
        this.occupancy = 0 // 占用背包的单位数，所有memory都是0
    }
    handleOnce(role) { // 装备时的操作
        if(role.equipments.memory){ // 把之前装备的memory去掉
            const old_memory = memory_list.filter((item) => { return item.name == role.equipments.memory })[0]
            for(let skill in old_memory.skills) {
                role.skills = role.skills.filter((item) => { return item != skill.name })
            }
        }
        role.equipments.memory = this.name
        for(let i = 0; i < this.skills.length; i++) {
            role.skills.push(this.skills[i].name)
        }
        Message.info(`成功装备忆晶-${this.name}`)
    }
}

export const memory_list = [
    new class extends MemoryBase {
        constructor() {
            super()
            this.name = '缚神的恩赐'
            this.content = '“虽然没有了之前的记忆，现在和姐姐，和沐沐在一起的生活也让我很满足啦！”——璃落'
            this.intro = `
                照片中璃雪穿着淡蓝色的晚礼服站在后方，安静地笑着。
                而穿着皮卡丘睡衣的沐沐正扑在璃落身上，一边将自己的白丝小脚丫塞到璃落嘴里，一边拿着两只巨型震动棒一脸坏笑地看向镜头。
                躺在地上只穿着粉色内衣裤的璃落是最惨的，不仅戴着眼罩遮住了大半张脸，而且小嘴还被开口器强行撑开，手脚都被密密麻麻地麻绳所缚，因此无法阻止沐沐的“暴行”，小巧的舌头正被沐沐的脚丫揪出口腔外玩弄着。
                `
            this.skills = role_skills.filter((skill) => { return skill.group == this.name })
        }
    }
]



export class Bag {
    constructor() {
        this.max_bag_capacity = 100 // 最大背包容量
        this.bag_occupancy = 1 // 当前已占用空间
        // 装备名称和数量（材料和消耗品有数量）
        this.equipment = { // 装备
            change_able: true, // 是否允许更换装备
            memory: ['缚神的恩赐'], // 忆晶
            weapons: [], // 法器
            straps: [], // 特殊服装
        }
        this.materials = { // 材料
            change_able: true,
            contents: [],
        }
        this.consumables = { // 消耗品
            change_able: true,
            contents: [],
        }
    }
    judgeAddStuff(occupancy, number) { // 判断该物品是否能存入背包中，参数为物品占用的背包栏位和物品数量
        if(this.bag_occupancy + occupancy * number > this.bag_occupancy){
            Message.warning(`储物空间已满，请整理控件或升级载具。`)
            return false
        }
        else { return true }
    }
}
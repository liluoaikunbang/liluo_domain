import { defineStore } from 'pinia'
import useClipboard from 'vue-clipboard3'
import { roles } from '../components/Domain/FieldData/Role'
import { game_step } from '../components/Index/GameStep'
import { Bag } from '../components/Index/Menu/Bag'
import { initSkills } from '../components/Domain/FieldData/RoleSkills'
import { splitString } from '../utils'
import { end_list } from '../components/Domain/FieldData/end'
import lodash from 'lodash'
import { base_title } from '../components/Index/GameStep'
import router from '../router'

// 第一个参数是应用程序中 store 的唯一 id
// 常用公共变量，参与存档
export const useUsersStore = defineStore("users", {
    state: () => {
      return {
        bondage_money: 0, // 紧缚币
        country_money: 1000, // 帝国金币
        game_step: lodash.cloneDeep(game_step), // 通过修改game_step内的内容跳转页面
        current_step: lodash.cloneDeep(game_step), // 人物所处的位置
        field_liluo: new roles.liluo(), // 人物冒险相关属性
        bag: new Bag(), // 人物背包相关
        untie_values: { // 脱缚能力，即一回合脱缚可消耗的拘束具耐久度。
          eye: { base: 100, current: 100 }, // base代表初始脱缚能力，current代表当前脱缚能力
          mouth: { base: 100, current: 100 }, 
          arm: { base: 100, current: 100 },
          finger: { base: 100, current: 100 }, 
          leg: { base: 100, current: 100 }, 
        },
      }
    },
    actions: {
      enterPlace(current_step, step_value) { // 进入其他地方时的通用操作
        router.push({
          path:`${router.currentRoute.value.fullPath}/${step_value}`
        })
      },
      saveLocalStage() {
        for (let item in this.$state) {
          if(typeof this[item] == 'object') { window.localStorage.setItem(item, JSON.stringify(this[item])) }
          else { window.localStorage.setItem(item, this[item]) }
        }
        console.log('成功保存数据')
      },
      clearLocalStage() {
        let clearedCount = 0
        for (let item in this.$state) {
          if (window.localStorage.getItem(item) !== null) {
            clearedCount += 1
          }
          window.localStorage.removeItem(item)
        }
        console.log('成功清空本机存档')
        return clearedCount
      },
      loadLocalStage() {
        const current_stage = {}
        for(let item in this.$state) {
          let data = window.localStorage.getItem(item)
          if(data === null) { continue }
          if(data.includes('{') || data.includes('[')) { current_stage[item] = JSON.parse(data) } // 通过大括号或中括号判断数据是否是object类型
          else { current_stage[item] = data }
        }
        console.log('成功读取数据')
        return JSON.stringify(current_stage)
      },
      parseStage() { // stringify时会将stage中的数字转化成字符串，因此读档后要将可以转化为数字的字符串全部转化为数字
        // 递归找到所有纯粹对象，对对象中的每一个元素进行格式化
        const findObject = (obj) => {
          for(let item in obj){
            if(Object.prototype.toString.call(obj[item]) === '[object Object]'){ // 对纯对象，继续向内递归
              findObject(obj[item])
            }
            else if(typeof obj[item] == 'string'){ // 对字符串，试图进行格式化
              let number = Number(this[item])
              if(!isNaN(number)){ this[item] = number }
            }
            else { continue } // 其他的，即数组和null，直接跳过
          }
        }
        findObject(this.$state)
        console.log('成功格式化数据')
      },
      stringifyStage() { // 将数据变为字符串形式并复制到剪切板中
        const { toClipboard } = useClipboard()
        toClipboard(JSON.stringify(this.$state))
        console.log('数据复制成功')
      },
    }
})

// 其他临时公共变量，不参与存档读档
export const useOtherStore = defineStore("others", {
  state: () => {
    return {
      right_size: {width: 0, height: 0}, // 领地界面的右侧框架尺寸
      all_images: null, // 所有图片组成的字典，在index页面中赋值

      backup_link: null, // 备份游戏模式下的链接，方便从阅读模式跳转回游戏模式时使用。
      current_story: 0, // 当前正在展示的色文，可用于阅读模式或游戏模式

      darkroom_item: null, // 备份darkroom中正在展示的item，
    }
  },
  actions: {
    initStoreItems() { // 将others中组件中的临时变量还原回初始值。
      this.darkroom_item = null
    },
    getImageHeight() {
      const height = this.right_size.height * 0.8
      // console.log('image_height', height)
      return height
    },
    getImageWidth() {
      const width = this.right_size.width * 0.9
      return width
    }
  }
})

// 拘束相关的临时公共变量，不参与存档读档
export const useBondageStore = defineStore("bondage", {
  state: () => {
    return {
      bondage_percent: 0, // 捆绑比率，人物会根据比率减少体力，比率通过各部位拘束值计算。
      damage_rate: 100, // 捆绑造成的伤害比率，计算捆绑造成的伤害时用bondage_percent x damage_rate
      total_value: 100, // 部位拘束值>100时代表该位置被完全拘束，再高仅仅会提高解缚难度。
      bondage_names: {
        eye: {base: '眼部', bondage: '蒙眼'},
        mouth: {base: '嘴巴', bondage: '封嘴'},
        arm: {base: '手臂', bondage: '缚手'},
        finger: {base: '手指', bondage: '包手'},
        leg: {base: '双腿', bondage: '捆腿'},
      },
      bondage_values: { // 拘束值，每个部位占20%捆绑比率。
        eye: 0,
        mouth: 0,
        arm: 0,
        finger: 0,
        leg: 0,
      },
      all_props: [], // 保存所有props的类，下方的bondage_props只保存名称。
      bondage_props: { // 当前身上各部位的拘束具，挣扎时优先选取列表中最后一件束具进行挣扎
        eye: [],
        mouth: [],
        arm: [],
        finger: [],
        leg: [],
      },
      bondage_states: [], // 被缚状态，指定部分影响属性的状态
      visibility: 1, // 可视程度，用于改变属性部分的透明度，蒙眼后会看不清
    }
  },
  actions: {
    updateBondageStates() {
      const store = useUsersStore()
      const states = [] // 备份bondage_states，在此函数结束时将改变后的states传递回去。
      const untie_values = lodash.cloneDeep(store.untie_values) // 备份untie_values，在此函数结束时将改变后的untie_values传递回去。
      for(let item in untie_values){ // 将untie_values中的current全部初始化为base的数值，防止每次进行此函数时重复变化。
        untie_values[item].current = untie_values[item].base
      }
      const halveAction = (item_key) => { // 全身脱缚能力根据某部位（item_key）的拘束程度按比例减少，最多减少一半
        const decrease_rate = Math.min(this.bondage_values[item_key], this.total_value) / this.total_value / 2
        for(let item in untie_values){
          untie_values[item].current -= parseInt(untie_values[item].current * decrease_rate)
        }
        return decrease_rate
      }
      if(this.bondage_values.eye > 0){ // 双眼被蒙
        const rate = Math.max((this.total_value - Math.min(this.bondage_values.eye, this.total_value)) / this.total_value, 0.1)
        this.visibility = rate
        states.push({name: '双眼被蒙', content: `对敌人属性和自身束缚程度的可视程度减少为${rate * 100}%`})
      }
      if(this.bondage_values.arm > 0){ // 双手被缚
        const rate = halveAction('arm')
        states.push({name: '双手被缚', content: `全身脱缚能力减少${rate * 100}%`})
      }
      if(this.bondage_values.finger > 0){ // 手指被缚
        const rate = halveAction('finger')
        states.push({name: '手指被缚', content: `全身脱缚能力减少${rate * 100}%`})
      }

      this.bondage_states = states
      store.untie_values = untie_values
    },
    clearBondage() { // 离开场景时清空身上的拘束具
      this.all_props = []
      for(let item in this.bondage_values){
        this.bondage_values[item] = 0
        this.bondage_props[item] = []
        this.updateBondageStates()
      }
    },
    getBondagePercent() { // 根据拘束值计算捆绑比率
      this.bondage_percent = 0
      for(let item in this.bondage_values){
        this.bondage_percent += parseInt(Math.min(this.bondage_values[item], 100) * 0.2)
      }
    },
    addBondageValue(value_object) { // 增加/减少拘束值
      this.bondage_values.eye += value_object.eye
      this.bondage_values.mouth += value_object.mouth
      this.bondage_values.arm += value_object.arm
      this.bondage_values.finger += value_object.finger
      this.bondage_values.leg += value_object.leg
      for(let item in this.bondage_values){
        this.bondage_values[item] = Math.max(this.bondage_values[item], 0) // 将小于最低束缚值的变为最低束缚值
      }
      this.getBondagePercent()
    },
    changeBondageValue(value_object) { // 修改拘束值
      this.bondage_values.eye = value_object.eye
      this.bondage_values.mouth = value_object.mouth
      this.bondage_values.arm = value_object.arm
      this.bondage_values.finger = value_object.finger
      this.bondage_values.leg = value_object.leg
      for(let item in this.bondage_values){
        this.bondage_values[item] = Math.max(this.bondage_values[item], 0) // 将小于最低束缚值的变为最低束缚值
      }
      this.getBondagePercent()
    },
    getPropClass(item_key) { // 提取该部位的最后一个束具名称，从总束具列表中找到束具的类。
      const bondage_name = this.bondage_props[item_key][this.bondage_props[item_key].length - 1]
      return this.all_props.filter((item) => { return item.name == bondage_name })[0]
    },
    getPropClassList(item_key) { // 提取该部位的所有束具的类，并返回列表 
      const props = []
      for(let i = 0; i < this.bondage_props[item_key].length; i++){
        props.push(this.all_props.filter((item) => { return item.name == this.bondage_props[item_key][i] })[0])
      }
      return props
    }
  }
})

// 探险相关的临时公共变量，不参与存档读档
export const useFieldStore = defineStore("field", {
  state: () => {
    return {
      step: 'base', // 探险界面总step
      button_mode: 'base', // 探险界面的按钮mode，有base、fighting、untie、rest
      att_role_mode: 'base', // 属性界面role部分展示的内容，可展示人物属性base或束缚状态bondage
      att_other_mode: 'base', // 属性界面other部分展示的内容，可展示敌人属性enemy或事件event
      special_mode: 'base', // 每个野外场景的特殊模块展示情况，常见的有progress（前进到下一区域）
      logs: [], // 日志
      role: useUsersStore().field_liluo,
      role_skills: [], // 当前人物拥有的技能列表
      event: null, // 当前遇到的事件（如果有的话）
      enemy: null, // 当前遇到的敌人（如果有的话）
      turn: 0, // 战斗时的回合数
      enemy_turn: false, // 敌人当前回合是否已经行动
      end: null, // 结束界面的内容
    }
  },
  actions: {
    initState() { // 开始冒险、结束战斗或离开野外后初始化store
      this.role.buffs = []
      this.role.debuffs = []
      this.step = 'base'
      this.att_role_mode = 'base'
      this.att_other_mode = 'base'
      this.button_mode = 'base'
      this.special_mode = 'base'
      this.event = null
      this.enemy = null
      this.turn = 0
      this.enemy_turn = false
      this.role_skills = initSkills(this.role)
    },
    addLogs(logs) { // 添加logs
      const log_list = splitString(logs)
      for(let i = 0; i < log_list.length; i++) {
        this.logs.push(log_list[i])
      }
    },
    // 事件相关action
    eventMode(event) {
      this.event = event
      this.att_other_mode = 'event'
      this.logs.push(`触发事件：${this.event.name}。`)
      this.logs.push(this.event.content)
    },
    // 战斗相关action
    enemyAction(){ // 敌人的行动
      if(!this.enemy_turn) { // 如果敌人还未行动，则让敌人进行本回合行动；如果敌人已经行动过，则直接跳过
          this.enemy_turn = true
          this.enemy.useSkills(this.turn)
      }
    },
    updateTurn(){ // 新的回合
      this.enemy_turn = false
      this.turn += 1
      this.enemy_button_mode = 'main'
      this.logs.push(`--第${this.turn}回合--`)
      if(this.role.SPD < this.enemy.SPD){ this.enemyAction() }
    },
    enemyMode(enemy) { // 将探险相关的内容切换为enemy模式
      this.enemy = enemy
      this.att_other_mode = 'enemy'
      this.logs.push(`遭遇敌人${this.enemy.name}，进入战斗！`)
      this.end = end_list[enemy.end_index]
      this.updateTurn() // 进入第一回合
    },
  }
})


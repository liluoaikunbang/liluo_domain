import { extend } from "lodash"

class ProductBase {
    constructor() {
        this.name = '' // 商品名称
        this.price = 0 // 商品价格
    }
    judgeAble(store) {
        if(store.country_money >= this.price) { return true }
        else { return false }
    }
}


// 户外车购买及改装
class CarBase extends ProductBase {
    constructor() {
        super()
    }
}

export const car_shop = {
    common: [ // 普通户外车
        new class extends ProductBase { // 购买汽车
            constructor() {
                super()
                this.name = '普通轿车'
                this.level_name = '普通轿车' // level名称，每次升级后修改，用于在菜单界面显示
                this.level = 1 // 车辆等级，每次升级车辆时进行升级
                this.content = '普通的户外车，具有一定越野能力，附赠简易护盾发生器，但无法满足太长时间的户外探险工作。'
                this.ownership = false // 是否拥有该车
                this.price = 100 // 价格
                this.comfort = 10 // 舒适度
                this.max_shields = 10 // 最大护盾
                this.shields = this.max_shields // 护盾
                this.open_shields = true // 是否打开车辆护盾，有护盾存在时不会受到debuff影响
                this.purchased_items = [] // 已购车内改装的名字
                this.handle_frequency = ['once'] // 只需要执行一次handle
                this.permissions = { // 权限，汽车可开启的功能
                    '烹饪模块': false,
                    '夜晚休息': false,
                    '护盾恢复': false,
                    '雪地探险': false,
                    '越野模块': false,
                    '监控模块': false,
                }
            }
            handleOnce(car) {
                car.ownership = true
            }
        },
        new class extends CarBase {
            constructor() {
                super()
                this.name = '自助做饭姬器人'
                this.content = '帮助做饭的自助机器人，可以将你的食材加工为可口的饭菜，且为你的探险载具增加5点舒适度。'
                this.price = 30
                this.handle_frequency = ['once'] // 只需要执行一次handle
            }
            handleOnce(car) {
                car.permissions['烹饪模块'] = true
                car.comfort += 5
            }
        }
    ],
    bed: [ // 小型面包车改装的床车
        new class extends CarBase {
            constructor(){
                super()
                this.name = '升级为床车'
                this.content = '将户外车升级为面包车大小的床车，后座可拼成双人床，可满足几日内的户外探险需求。舒适度加20，最大护盾加50，增加夜晚休息功能。'
                this.price = 200
                this.handle_frequency = ['once']
            }
            handleOnce(car) {
                car.level += 1
                car.level_name = '小型床车'
                car.comfort += 20
                car.max_shields += 50
                car.shields = car.max_shields
                car.permissions['夜晚休息'] = true
            }
        },
        new class extends CarBase {
            constructor() {
                super()
                this.name = '护盾恢复装置'
                this.content = '给汽车加装护盾恢复装置，让你在战斗后可以恢复护盾。'
                this.price = 100
                this.handle_frequency = ['once']
            }
            handleOnce(car) {
                car.permissions['护盾恢复'] = true
            }
        },
        new class extends CarBase {
            constructor(){
                super()
                this.name = '音响和电视'
                this.content = '安装车载音箱，并在床尾安装高清电视，提升10点舒适度。'
                this.price = 50
                this.handle_frequency = ['once']
            }
            handleOnce(car) {
                car.comfort += 10
            }
        },
    ],
    house: [ // 房车，顶配车型
        new class extends CarBase {
            constructor(){
                super()
                this.name = '升级为房车'
                this.content = '将床车升级为舒适的房车，车内提供双人床、卫生间、洗衣机等一系列生活措施，可满足长时间探险工作。提升50点舒适度，增加100点护盾。'
                this.price = 500
                this.handle_frequency = ['once']
            }
            handleOnce(car) {
                car.level += 1
                car.level_name = '魔改房车'
                car.comfort += 50
                car.max_shields += 100
                car.shields = car.max_shields
            }
        },
        new class extends CarBase {
            constructor(){
                super()
                this.name = '防寒套装'
                this.content = '安装高功率供暖设备、备用雪地胎、防冻油箱和水箱等一系列防寒装备，提升5点舒适度并让你拥有在低温区域探险的能力。'
                this.price = 100
                this.handle_frequency = ['once']
            }
            handleOnce(car) {
                car.comfort += 5
                car.permissions['雪地探险'] = true
            }
        },
        new class extends CarBase {
            constructor(){
                super()
                this.name = '越野系统'
                this.content = '增高车辆底盘，加装动力锁等越野模块，让车辆拥有在复杂野外前进的能力。'
                this.price = 100
                this.handle_frequency = ['once']
            }
            handleOnce(car) {
                car.permissions['越野模块'] = true
            }
        },
        new class extends CarBase {
            constructor(){
                super()
                this.name = '监控系统'
                this.content = '加装四路监控模块，让你在休息时也能实时看到车外状况。'
                this.price = 100
                this.handle_frequency = ['once']
            }
            handleOnce(car) {
                car.permissions['监控模块'] = true
            }
        },
    ]
}








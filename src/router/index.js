import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'

const routes = [
    {
      path: '/',
      name: 'site-home',
      component: () => import('../pages/SitePage.vue'),
    },
    {
        path: '/readme',
        redirect: '/',
    },
    {
        path: '/worlds',
        name: 'site-worlds',
        component: () => import('../pages/SitePage.vue'),
    },
    {
        path: '/worlds/:worldId',
        name: 'site-world-detail',
        component: () => import('../pages/SitePage.vue'),
    },
    {
        path: '/worlds/:worldId/series/:seriesId',
        name: 'site-series',
        component: () => import('../pages/SitePage.vue'),
    },
    {
        path: '/characters',
        name: 'site-characters',
        component: () => import('../pages/SitePage.vue'),
    },
    {
        path: '/characters/:characterId',
        name: 'site-character-detail',
        component: () => import('../pages/SitePage.vue'),
    },
    {
        path: '/gallery',
        name: 'site-gallery',
        component: () => import('../pages/SitePage.vue'),
    },
    {
        path: '/evidence',
        name: 'site-evidence',
        component: () => import('../pages/SitePage.vue'),
    },
    {
        path: '/production',
        name: 'site-production',
        component: () => import('../pages/SitePage.vue'),
    },
    {
        path: '/roadmap',
        name: 'site-roadmap',
        component: () => import('../pages/SitePage.vue'),
    },
    {
        path: '/devlog',
        name: 'site-devlog',
        component: () => import('../pages/SitePage.vue'),
    },
    {
        path: '/collab',
        name: 'site-collab',
        component: () => import('../pages/SitePage.vue'),
    },
    {
        path: '/read_page',
        name: 'read_page',
        component: () => import('../pages/Index/ReadPage.vue'),
    },
    {
        path: '/game',
        name: 'game',
        component: () => import('../game/views/GameView.vue'),
    },
    {
      path: '/index',
      name: 'index',
      component: () => import('../pages/Index.vue'),
      children: [
        {
            path: '/home',
            name: 'home',
            component: () => import('../pages/Index/Home.vue'), 
        },
        {
            path: '/urging',
            name: 'urging',
            component: () => import('../pages/Index/Urging.vue'), 
        },
        {
            path: '/update',
            name: 'update',
            component: () => import('../pages/Index/Update.vue'), 
        },
        {
            path: '/gartitude',
            name: 'gartitude',
            component: () => import('../pages/Index/Gartitude.vue'), 
        },
        {
            path: '/start',
            name: 'start',
            component: () => import('../pages/Index/Start.vue'),
            children: [
                // 璃落的小窝
                {
                    path: '/liluo_house',
                    name: 'liluo_house',
                    component: () => import('../pages/Domain/LiLuoHouse.vue'), 
                },

                { // 璃落的房间
                    path: '/liluo_house/liluo',
                    name: 'liluo',
                    component: () => import('../components/Domain/LiLuoHouse/LiLuo.vue'), 
                },
                { // 璃落的房间
                    path: '/liluo_house/liluo/stupid_map',
                    name: 'stupid_map',
                    component: () => import('../components/Domain/LiLuoHouse/LiLuo/StupidMap.vue'), 
                },

                { // “囚笼”空间（涩涩后室）
                    path: '/liluo_house/darkroom',
                    name: 'darkroom',
                    component: () => import('../components/Domain/LiLuoHouse/Darkroom.vue'), 
                },
                {
                    path: '/liluo_house/darkroom/levels',
                    name: 'darkroom_levels',
                    component: () => import('../components/Domain/LiLuoHouse/Darkroom/Levels.vue'), 
                },
                {
                    path: '/liluo_house/darkroom/enemies',
                    name: 'darkroom_enemies',
                    component: () => import('../components/Domain/LiLuoHouse/Darkroom/Enemies.vue'), 
                },

                {
                    path: '/liluo_house/mumu',
                    name: 'mumu',
                    component: () => import('../components/Domain/LiLuoHouse/MuMu.vue'), 
                },
                {
                    path: '/liluo_house/mumu/:id',
                    name: 'mumu_story',
                    component: () => import('../components/base/GameDisplayStory.vue'), 
                },
                {
                    path: '/liluo_house/lixue',
                    name: 'lixue',
                    component: () => import('../components/Domain/LiLuoHouse/LiXue.vue'), 
                },
                {
                    path: '/liluo_house/story',
                    name: 'story',
                    component: () => import('../components/Domain/LiLuoHouse/Story.vue'), 
                },


                // 缚神领地
                {
                    path: '/liluo_house/domain',
                    name: 'domain',
                    component: () => import('../pages/Index/Domain.vue'), 
                },
                // 住宅区
                { // 看看手机
                    path: '/liluo_house/domain/phone',
                    name: 'phone',
                    component: () => import('../pages/Domain/Phone.vue'), 
                },

                {
                    path: '/liluo_house/domain/phone/adventure',
                    name: 'adventure',
                    component: () => import('../components/Domain/Phone/Adventure.vue'), 
                },
                {
                    path: '/liluo_house/domain/phone/adventure/:id',
                    name: 'adventure_story',
                    component: () => import('../components/base/GameDisplayStory.vue'), 
                },

                {
                    path: '/liluo_house/domain/phone/forum',
                    name: 'forum',
                    component: () => import('../components/Domain/Phone/Forum.vue'), 
                },

                { // 找邻居串门
                    path: '/liluo_house/domain/neighbors',
                    name: 'neighbors',
                    component: () => import('../pages/Domain/Neighbors.vue'), 
                },
                {
                    path: '/liluo_house/domain/neighbors/:id',
                    name: 'neighbors_story',
                    component: () => import('../components/base/GameDisplayStory.vue'), 
                },
                
                { // 玖儿的神秘小屋
                    path: '/liluo_house/domain/jiuer',
                    name: 'jiuer_house',
                    component: () => import('../pages/Domain/JiuEr.vue'), 
                },
                {
                    path: '/liluo_house/domain/jiuer/jiuer',
                    name: 'jiuer',
                    component: () => import('../components/Domain/JiuEr/Jiuer.vue'), 
                },
                {
                    path: '/liluo_house/domain/jiuer/liluo',
                    name: 'jiuer_house_liluo',
                    component: () => import('../components/Domain/JiuEr/LiLuo.vue'), 
                },
                {
                    path: '/liluo_house/domain/jiuer/liluo/:id',
                    name: 'jiuer_house_liluo_story',
                    component: () => import('../components/base/GameDisplayStory.vue'), 
                },

                // 商业区
                {
                    path: '/liluo_house/domain/experience_shop',
                    name: 'experience_shop',
                    component: () => import('../pages/Domain/ExperienceShop.vue'), 
                },

                { // 密室逃脱店
                    path: '/liluo_house/domain/chamber_shop',
                    name: 'chamber_shop',
                    component: () => import('../pages/Domain/ChamberShop.vue'), 
                },
                {
                    path: '/liluo_house/domain/chamber_shop/chamber1',
                    name: 'chamber1',
                    component: () => import('../components/Domain/ChamberShop/Chamber1.vue'), 
                },
                {
                    path: '/liluo_house/domain/chamber_shop/chamber2',
                    name: 'chamber2',
                    component: () => import('../components/Domain/ChamberShop/Chamber2.vue'), 
                },
                {
                    path: '/liluo_house/domain/chamber_shop/chamber3',
                    name: 'chamber3',
                    component: () => import('../components/Domain/ChamberShop/Chamber3.vue'), 
                },

                { // 缚之魂影院
                    path: '/liluo_house/domain/cinema',
                    name: 'cinema',
                    component: () => import('../pages/Domain/Cinema.vue'), 
                },
                {
                    path: '/liluo_house/domain/cinema/:id',
                    name: 'cinema_story',
                    component: () => import('../components/base/GameDisplayStory.vue'), 
                },


                { // 兽耳美食城
                    path: '/liluo_house/domain/gourmet_palace',
                    name: 'gourmet_palace',
                    component: () => import('../pages/Domain/GourmetPalace.vue'), 
                },
                {
                    path: '/liluo_house/domain/gourmet_palace/pub',
                    name: 'pub',
                    component: () => import('../components/Domain/GourmetPlace/Pub.vue'), 
                },
                {
                    path: '/liluo_house/domain/gourmet_palace/pub/:id',
                    name: 'pub_story',
                    component: () => import('../components/base/GameDisplayStory.vue'), 
                },

                // 功能区
                { // 缚神殿
                    path: '/liluo_house/domain/church',
                    name: 'church',
                    component: () => import('../pages/Domain/Church.vue'), 
                },
                {
                    path: '/liluo_house/domain/church/:id',
                    name: 'church_story',
                    component: () => import('../components/base/GameDisplayStory.vue'), 
                },
                {
                    path: '/liluo_house/domain/church/settings',
                    name: 'settings',
                    component: () => import('../components/Domain/Church/Settings.vue'), 
                },
                {
                    path: '/liluo_house/domain/church/kidnapper',
                    name: 'kidnapper',
                    component: () => import('../components/Domain/Church/kidnapper.vue'), 
                },

                { // 夕押梨公司
                    path: '/liluo_house/domain/company',
                    name: 'company',
                    component: () => import('../pages/Domain/Company.vue'), 
                },
                {
                    path: '/liluo_house/domain/company/:id',
                    name: 'company_story',
                    component: () => import('../components/base/GameDisplayStory.vue'), 
                },

                { // 笨笨之家
                    path: '/liluo_house/domain/stupid_house',
                    name: 'stupid_house',
                    component: () => import('../pages/Domain/StupidHouse.vue'), 
                },
                {
                    path: '/liluo_house/domain/stupid_house/:id',
                    name: 'stupid_house_story',
                    component: () => import('../components/base/GameDisplayStory.vue'), 
                },
                {
                    path: '/liluo_house/domain/stupid_house/visiting',
                    name: 'visiting',
                    component: () => import('../components/Domain/StupidHouse/Visiting.vue'), 
                },

                // 慕妮卡帝国
                {
                    path: '/liluo_house/empire',
                    name: 'empire',
                    component: () => import('../pages/Index/Empire.vue'), 
                },

                { // 荒野
                    path: '/liluo_house/empire/wilderness',
                    name: 'wilderness',
                    component: () => import('../pages/Empire/Wilderness.vue'), 
                },
                { // 醉欲之城
                    path: '/liluo_house/empire/wilderness/lust',
                    name: 'lust',
                    component: () => import('../pages/Empire/Lust.vue'), 
                },
                { // 深渊幽狱
                    path: '/liluo_house/empire/wilderness/prison',
                    name: 'prison',
                    component: () => import('../pages/Empire/Prison.vue'), 
                },
                {
                    path: '/liluo_house/empire/wilderness/prison/:id',
                    name: 'prison_story',
                    component: () => import('../components/base/GameDisplayStory.vue'), 
                },

                { // 炊烟之城
                    path: '/liluo_house/empire/smoke',
                    name: 'smoke',
                    component: () => import('../pages/Empire/Smoke.vue'), 
                },
                {
                    path: '/liluo_house/empire/smoke/:id',
                    name: 'smoke_story',
                    component: () => import('../components/base/GameDisplayStory.vue'), 
                },

                { // 温泉湖小镇
                    path: '/liluo_house/empire/springs',
                    name: 'springs',
                    component: () => import('../pages/Empire/Springs.vue'), 
                },
                {
                    path: '/liluo_house/empire/springs/festival',
                    name: 'festival_2024',
                    component: () => import('../components/Empire/Springs/Festival.vue'), 
                },
                {
                    path: '/liluo_house/empire/springs/festival/:id',
                    name: 'festival_2024_story',
                    component: () => import('../components/base/GameDisplayStory.vue'), 
                },

                { // 魔物森林
                    path: '/liluo_house/empire/monster_forest',
                    name: 'monster_forest',
                    component: () => import('../pages/Empire/MonsterForest.vue'), 
                },
                { // 魔物介绍指南
                    path: '/liluo_house/empire/monster_forest/monster_dictionary',
                    name: 'monster_dictionary',
                    component: () => import('../components/Empire/MonsterForest/MonsterDictionary.vue'), 
                },

                { // 蜘蛛神社
                    path: '/liluo_house/empire/monster_forest/shrine',
                    name: 'shrine',
                    component: () => import('../components/Empire/MonsterForest/Shrine.vue'), 
                },
                {
                    path: '/liluo_house/empire/monster_forest/shrine/:id',
                    name: 'shrine_story',
                    component: () => import('../components/base/GameDisplayStory.vue'), 
                },
                {
                    path: '/liluo_house/empire/monster_forest/shrine/photos',
                    name: 'shrine_photos',
                    component: () => import('../components/Empire/MonsterForest/Shrine/Photos.vue'), 
                },
            ]
        },
      ]
    },
  ]

const router = createRouter({
// 这里使用hash模式路由
  history: createWebHashHistory(),  
  routes,
})

export default router

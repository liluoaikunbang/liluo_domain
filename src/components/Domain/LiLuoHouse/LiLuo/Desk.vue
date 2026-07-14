<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <a-input-password
                v-model="password"
                :visibility="show_password"
                placeholder="请输入密码"
                :style="{width:'80%'}"
                :defaultVisibility="false"
                allow-clear
            />
            <LiButton class="default-button" @click="confirmPassword()">确定</LiButton><br>
            <p>{{ message }}</p>
        </template>
        <template #right>
            <p>位于公主床下方的淡粉色书桌，上面配备的书柜内摆放着璃落爱看的一些涩涩书本，不过书柜上有一个密码锁，需要输入正确的密码才能打开。</p>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'sexy'">
        <template #left>
            <h3>按作者划分</h3>
            <div v-for="(item, index) in sexy" :key="index">
                <LiButton class="default-button" @click="author = index">{{ index }}</LiButton>
            </div>
        </template>
        <template #right>
            <div v-if="author">
                <h3>{{ author }} 的作品</h3>
                <div v-for="item in sexy[author]" :key="item">
                    <a-collapse accordion v-if="item.series">
                        <a-collapse-item key="1" :header="item.title">
                            <LiButton class="default-button" v-for="sub_item in item.content" :key="sub_item" @click="step.main.step = 'article'; article = sub_item">{{ sub_item.title }}</LiButton>
                        </a-collapse-item>
                    </a-collapse>
                    <LiButton class="default-button" v-else @click="step.main.step = 'article'; article = item">{{ item.title }}</LiButton>
                </div>
            </div>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'article'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'sexy'">回到涩文选择界面</LiButton>
        </template>
        <template #right>
            <h3>{{ article.title }}</h3>
            <p v-for="section in splitString(article.content)" :key="section">{{ section }}</p>
        </template>
    </DomainLayout>
</template>

<script setup>
    import { useUsersStore } from '@/store/store'
    import { sexy } from '@/assets/sexy'
    import { splitString } from '@/utils'

    const store = useUsersStore()
    const step = ref(store.game_step.liluo.desk)
    const author = ref()
    const article = ref()

    const password = ref()
    const show_password = ref(false)
    const message = ref()

    const confirmPassword = () => {
        if(password.value == '123456') { store.enterPlace(step.value, 'sexy', '璃落收藏的涩文')}
        else { message.value = '密码错误' }
    }

</script>

<style scoped>
</style>

<template>
    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <a-collapse accordion>
                <a-collapse-item header="前传：百日惊梦" key="1">
                    <LiButton v-for="item in advanture_text.before_dream" :key="item" class="default-button" @click="enterStoryLink(item)">{{ item.title }}</LiButton>
                </a-collapse-item>
                <a-collapse-item header="正篇：灵异学院" key="2">
                    <LiButton v-for="item in advanture_text.main_ruyue" :key="item" class="default-button" @click="enterStoryLink(item)">{{ item.title }}</LiButton>
                </a-collapse-item>
                <a-collapse-item header="特别篇：催更作者璃落" key="3">
                    <LiButton v-for="item in advanture_text.special_urging" :key="item" class="default-button" @click="enterStoryLink(item)">{{ item.title }}</LiButton>
                </a-collapse-item>
            </a-collapse>
        </template>
        <template #right>
            <p>每次璃落从其他世界冒险回来，这个神奇的邮件箱里面就会出现记录着她冒险时的经历的邮件，记录的细节程度让璃落一度怀疑是她自己梦游写的……</p>
            <p>不过姐姐似乎对这件事见怪不怪，难道这也是那位神秘的缚神姐姐的能力？</p>
            <p>可惜即使在这里也没法找到太多自己失忆前的记录，想找回以前的记忆也许只能去故国遗址看看了。</p>
        </template>
    </DomainLayout>

</template>

<script setup>
    import { advanture_text } from '@/assets/TextualData'
    import { useUsersStore } from '@/store/store'
    import { enterStoryLink } from '@/utils'

    const store = useUsersStore()
    const step = ref(store.game_step.domain.phone.adventure)
    const story = ref()

</script>

<style scoped>
</style>




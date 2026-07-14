<template>
    <!-- 更新日志 -->
    <div class="start">
        <h2>更新日志</h2>
        <a-collapse accordion>
            <a-collapse-item v-for="item in update_month" :key="`${item.year}-${item.month}`" :header="`${item.year}年${item.month}月`">
                <template v-for="section in update_log" :key="section">
                    <p v-if="item.year == section.year && item.month == section.month">
                        {{ section.year + '年' + section.month + '月' + section.date + '日' + '，' + section.content }}
                    </p>
                </template>
            </a-collapse-item>
        </a-collapse>
        <LiButton class="return-button" @click="$router.push('home')">游戏主菜单</LiButton>
    </div>
</template>

<script setup>
    import { update } from '@/components/Index/Update'
    import lodash from 'lodash'

    const update_log = lodash.reverse(update) // 将更新日志列表逆置，让最新更新记录放在最前面
    const update_month = lodash.union(update_log.map((item) => { // 将日志按月份分组
        return `${item.year}-${item.month}`
    })).map((item) => { // union方法不能索引数组内的字典，因此选择在union方法后再将原数组内元素变为字典
        return { year: item.split('-')[0], month: item.split('-')[1] }
    })

</script>

<style scoped>
</style>




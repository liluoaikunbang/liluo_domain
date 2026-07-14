<template>
    <span>
        <template v-for="(line, lineIndex) in lines" :key="'line-' + lineIndex">
            <br v-if="lineIndex > 0" />
            <template v-for="(part, partIndex) in parseStrikethrough(line)" :key="'part-' + partIndex">
                <del v-if="partIndex % 2 === 1">{{ part }}</del>
                <span v-else>{{ part }}</span>
            </template>
        </template>
    </span>
</template>

<script setup>
    import { computed } from 'vue'

    const props = defineProps(['text'])
    
    const lines = computed(() => {
        if (!props.text) return []
        return props.text.split('<br>')
    })

    const parseStrikethrough = (text) => {
        return text.split('--')
    }
</script>

<style scoped>
    del {
        text-decoration: line-through;
        color: rgba(255, 255, 255, 0.5); /* 稍微调淡一点划掉的文字 */
    }
</style>

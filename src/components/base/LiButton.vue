<template>
    <button class="li-button-disabled" type="button" v-if="disabled" disabled><slot></slot></button>
    <button class="li-button" type="button" v-else><slot></slot></button>
</template>

<script>

export default {
    props: ['disabled'],
    setup() {
        return {
        }
    }
}
</script>

<style scoped>
    .li-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        max-width: 100%;
        box-sizing: border-box;
        color: white;
        background: rgb(195, 94, 195);
        font-size: 17px;
        line-height: 1.35;
        text-align: center;
        white-space: normal;
        overflow-wrap: anywhere;
        border-radius: 10px;
        padding: 2px 10px 2px 10px;
    }
    .li-button-disabled {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        max-width: 100%;
        box-sizing: border-box;
        color: white;
        background: rgba(220, 165, 220, 0.5);
        font-size: 17px;
        line-height: 1.35;
        text-align: center;
        white-space: normal;
        overflow-wrap: anywhere;
        border-radius: 10px;
        padding: 2px 10px 2px 10px;
    }
</style>



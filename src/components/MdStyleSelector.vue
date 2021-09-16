<script setup lang="ts">
import HljsStyleEnums from "@/types/hljs-style-enum";
import { HljsStyleTypes } from "@/types/hljs-style-types";
import hljsCss from "@/generator/hljs-css.json";

const cssKeys: string[] = hljsCss.styles;

const { defaultStyle } = defineProps<{
    defaultStyle?: keyof HljsStyleTypes;
}>();

const emit = defineEmits<{
    (e: "styleChange", value: HljsStyleEnums): void;
}>();

function onChange(e: any) {
    emit("styleChange", e.target.value);
}
</script>

<template>
    <select @change="onChange" class="markdown-style-selector">
        <option
            v-for="css of cssKeys"
            :selected="css === (defaultStyle || HljsStyleEnums['github-dark'])"
            v-text="css"
        ></option>
    </select>
</template>

<style scope lang="less">
.markdown-style-selector {
    width: fit-content;
}
</style>

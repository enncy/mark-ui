<template>
    <textarea
        :data-render-keys="renderKeys"
        @drop="(e) => emit('filesUpdate', resolveFiesUpdate(e))"
        @input="onChange"
        @keydown="resolveTabKeyDown"
    ></textarea>
</template>

<script setup lang="ts">
import { ref, toRefs } from "@vue/reactivity";
import { resolveTabKeyDown, resolveFiesUpdate } from "@/utils/editor";

const props = defineProps<{
    modelValue: any;
    renderKeys: (string | number)[];
}>();
const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
    (e: "filesUpdate", files: File[]): void;
}>();

const { renderKeys } = toRefs(props);
const content = ref("");

// 值变化
function onChange(e: any) {
    content.value = e.target.value;
    emit("update:modelValue", e.target.value);
}
</script>

<style scope lang="less"></style>

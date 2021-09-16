<template>
    <div
        class="markdown-body"
        :data-render-key="renderKey"
        :class="'hl-' + codeStyle.toString().replace('/', '-')"
        v-html="result"
    ></div>
</template>

<script setup lang="ts">
import { computed, toRefs, watch, nextTick } from "vue";
import markdown from "@/core/markdown";
import HljsStyleEnums from "@/types/hljs-style-enum";
import { scrollToLine } from "@/utils/render";

const props = defineProps<{
    content?: string;
    codeStyle: HljsStyleEnums;
    renderKey?: number | string;
}>();

const { content, codeStyle, renderKey } = toRefs(props);
let result = computed(() => markdown.render(content?.value || ""));

// 内容缓存
let content_cache: any[] = content?.value?.split("\n") || [];
// 改动的行数
let temp_line = -1;

// 监听变化，自动检测当前编辑的高度，并滑动到此高度
if (result?.value) {
    watch([result], async () => {
        await nextTick();

        // 当前对象，如果未指定则获取第一个类为 ".markdown-body" 的对象

        const render: any = document.querySelector(
            renderKey?.value
                ? `[data-render-key='${renderKey?.value}']`
                : ".markdown-body"
        );

        const lines = content?.value?.split("\n") || [];
        for (let i = 0; i < lines.length; i++) {
            // 判断该行是否被改动，以及防抖

            if (lines[i] != content_cache[i] && temp_line !== i) {
                temp_line = i;

                // 滚动到指定的行数
                scrollToLine(render, i);

                break;
            }
        }

        content_cache = content?.value?.split("\n") || [];
    });
}
</script>

<style scope lang="less"></style>

import { HljsStyleTypes } from '../types/hljs-style-types';
import { PropType, defineComponent, toRefs, ref } from 'vue';
import { computed, watch, nextTick } from "vue";
import markdown from "../markdown";
import HljsStyleEnums from "../types/hljs-style-enum";
import { scrollToLine } from "../utils/render";

function getRender(renderKey: any) {
    // 当前对象，如果未指定则获取第一个类为 ".markdown-body" 的对象
    const render: any = document.querySelector(
        renderKey
            ? `[data-render-key='${renderKey}']`
            : ".markdown-body"
    );

    return render;
}

export const MdRender = defineComponent({
    name: 'MdRender',
    props: {
        content: {
            type: String,
            default: '',
            required: false
        },
        codeStyle: {
            type: String as PropType<keyof HljsStyleTypes>,
            default: HljsStyleEnums['github-dark'],
            required: false
        },
        renderKey: {
            type: String,
            required: false
        },
        raw: {
            type: Boolean,
            default:false,
            required: false
        }
    },
    setup(props, { slots }) {


        const { content, codeStyle, renderKey, raw } = toRefs(props)
        let result = ref("")
    
        if (raw.value) {
            nextTick(() => {
                const html = getRender(renderKey.value)?.innerHTML || ''
                result.value = markdown.render(html.replace(/\n/g, '<br>') || "")
            })
        } else {
            result = computed(() => markdown.render(content?.value || ""));

            // 内容缓存
            let content_cache: any[] = content.value?.split("\n") || [];
            // 改动的行数
            let temp_line = -1;
        
            // 监听变化，自动检测当前编辑的高度，并滑动到此高度
            watch(result, async () => { 
                await nextTick();
                const render = getRender(renderKey.value)

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

        return () => (
            <div
                data-render-key={renderKey.value}
                class={'markdown-body hl-' + codeStyle.value.toString().replace('/', '-')}
                v-html={result.value}
            >
                <slot></slot>
            </div>
        );
    },
});

export default MdRender
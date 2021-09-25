import { HljsStyleTypes } from '../../types/hljs-style-types';
import { PropType, defineComponent, toRefs, ref, onMounted, onUpdated } from 'vue';
import { computed, watch, nextTick } from "vue";
import markdown from "../../markdown";
import HljsStyleEnums from "../../types/hljs-style-enum";
import { autoChangeStyle, contentCopy, formatPreElementContent, getRender, resolveRaw, scrollToLine } from ".";



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
        raw: {
            type: Boolean,
            default: false,
            required: false
        },
        showCodeTool: {
            type: Boolean,
            default: true,
            required: false
        }
    },
    emits: ['copy'],
    setup(props, { slots, emit }) {

        const { content, codeStyle, raw, showCodeTool } = toRefs(props)
        let result = ref("")
        let render = ref<HTMLDivElement | null>(null)
        onMounted(() => {
            if (showCodeTool) {
                toolResolve()
            }
            renderRaw()
        })
        // 在页面DOM更新的时候，同时更新 raw
        onUpdated(renderRaw)

        watch(result, () => {
            nextTick(toolResolve)
        })

        // 显示代码的悬浮窗工具
        function toolResolve() {
            autoChangeStyle(render.value);
            contentCopy(render.value, (value) => {
                emit('copy', value)
            })
        }

        function renderRaw() {
            nextTick(() => {
                if (raw.value && render.value) {
                    const rawMD = resolveRaw(render.value)
                    result.value = rawMD
                    render.value.innerHTML = rawMD
                }
            })
        }



        // 内容缓存
        let content_cache: any[] = content.value?.split("\n") || [];
        // 改动的行数
        let temp_line = -1;


        // 监听变化，自动检测当前编辑的高度，并滑动到此高度
        watch(content, () => {
            nextTick(() => {
                if (!raw.value) {
                    result.value = markdown.render(content?.value || "")
                }
                if (render.value) {
                    render.value.innerHTML = result.value

                    const lines = content?.value?.split("\n") || [];
                    for (let i = 0; i < lines.length; i++) {
                        // 判断该行是否被改动，以及防抖

                        if (lines[i] != content_cache[i] && temp_line !== i) {
                            temp_line = i;
                            // 滚动到指定的行数
                            scrollToLine(render.value, i);
                            break;
                        }
                    }
                    content_cache = content?.value?.split("\n") || [];
                }
            });
        });



        return () => (
            <div

                ref={render}
                class={'markdown-body hl-' + codeStyle.value.toString().replace('/', '-')}
            >
                {raw.value ? slots.default?.() : <div v-html={result.value}></div>}
            </div>

        );
    },
});

export default MdRender
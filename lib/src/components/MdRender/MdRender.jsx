import { defineComponent, toRefs, ref, onMounted } from 'vue';
import { watch, nextTick } from "vue";
import markdown from "../../markdown";
import HljsStyleEnums from "../../types/hljs-style-enum";
import { autoChangeStyle, contentCopy, resolveRaw, scrollToLine } from ".";
export const MdRender = defineComponent({
    name: 'MdRender',
    props: {
        content: {
            type: String,
            default: '',
            required: false
        },
        codeStyle: {
            type: String,
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
        const { content, codeStyle, raw, showCodeTool } = toRefs(props);
        let result = ref("");
        let render = ref(null);
        onMounted(() => {
            if (showCodeTool) {
                toolResolve();
            }
            nextTick(() => {
                if (raw.value && render.value) {
                    const rawMD = resolveRaw(render.value);
                    result.value = rawMD;
                    render.value.innerHTML = rawMD;
                }
            });
        });
        watch(result, () => {
            nextTick(toolResolve);
        });
        // 显示代码的悬浮窗工具
        function toolResolve() {
            autoChangeStyle(render.value);
            contentCopy(render.value, (value) => {
                emit('copy', value);
            });
        }
        // 内容缓存
        let content_cache = content.value?.split("\n") || [];
        // 改动的行数
        let temp_line = -1;
        // 监听变化，自动检测当前编辑的高度，并滑动到此高度
        watch(content, () => {
            nextTick(() => {
                if (!raw.value) {
                    result.value = markdown.render(content?.value || "");
                }
                if (render.value) {
                    render.value.innerHTML = result.value;
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
        return () => (<div ref={render} class={'markdown-body hl-' + codeStyle.value.toString().replace('/', '-')}>
                {raw.value ? slots.default?.() : <div v-html={result.value}></div>}
            </div>);
    },
});
export default MdRender;

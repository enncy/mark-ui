import { defineComponent, toRefs } from 'vue';
import { ref } from "@vue/reactivity";
import { resolveFiesUpdate, resolveTabKeyDown } from '.';
export const MdEditor = defineComponent({
    name: 'MdEditor',
    props: {
        modelValue: String,
        renderKeys: {
            type: Array,
            default: [],
        }
    },
    emits: ["update:modelValue", 'filesUpdate'],
    setup(props, { slots, attrs, emit }) {
        const { renderKeys } = toRefs(props);
        const content = ref("");
        // 值变化
        const onChange = (e) => {
            content.value = e.target.value;
            emit("update:modelValue", e.target.value);
        };
        return () => (<textarea data-render-keys={renderKeys.value} onDrop={(e) => emit('filesUpdate', resolveFiesUpdate(e))} onInput={onChange} onKeydown={resolveTabKeyDown}></textarea>);
    },
});
export default MdEditor;

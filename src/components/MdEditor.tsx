import { PropType, defineComponent, toRefs } from 'vue';

import { ref } from "@vue/reactivity";
import { resolveFiesUpdate, resolveTabKeyDown } from "../utils/editor";




export const MdEditor = defineComponent({
    name: 'MdEditor',
    props: {
        modelValue: String,
        renderKeys: {
            type: Array as PropType<Array<string | number>>,
            default: [],
        }
    },
    emits: ["update:modelValue", 'filesUpdate'],
    setup(props, { slots, attrs, emit }) {
        const { renderKeys } = toRefs(props)
        const content = ref("");

        // 值变化
        const onChange = (e: any) => {
            content.value = e.target.value;
            emit("update:modelValue", e.target.value);
        }



        return () => (
            <textarea
                data-render-keys={renderKeys.value}
                onDrop={(e: any) => emit('filesUpdate', resolveFiesUpdate(e))}
                onInput={onChange}
                onKeydown={resolveTabKeyDown}
            ></textarea >
        );
    },
});

export default MdEditor;
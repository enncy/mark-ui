import { defineComponent } from 'vue';
import { ref } from "@vue/reactivity";
import { resolveFiesUpdate, resolveTabKeyDown } from "../utils/editor";
const emit = defineEmits();
export default defineComponent({
    name: 'render',
    props: {
        modelValue: String,
        renderKeys: {
            type: Array,
            default: [],
        }
    },
    emits: {
        "update:modelValue": null,
        filesUpdate: (files) => { }
    },
    setup(props, { slots }) {
        const content = ref("");
        // 值变化
        function onChange(e) {
            content.value = e.target.value;
            emit("update:modelValue", e.target.value);
        }
        return () => (<textarea data-render-keys={props.renderKeys} v-on-drop={(e) => emit('filesUpdate', resolveFiesUpdate(e))} v-on-input={onChange} v-on-keydown={resolveTabKeyDown}></textarea>);
    },
});

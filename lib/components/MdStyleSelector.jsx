import { defineComponent, toRefs } from 'vue';
import HljsStyleEnums from "../types/hljs-style-enum";
import hljsCss from "../generator/hljs-css.json";
export const MdStyleSelector = defineComponent({
    name: 'MdStyleSelector',
    props: {
        defaultStyle: {
            type: String,
            default: '',
        }
    },
    emits: ['styleChange'],
    setup(props, { slots, attrs, emit }) {
        const { defaultStyle } = toRefs(props);
        const cssKeys = hljsCss.styles;
        function onChange(e) {
            emit("styleChange", e.target.value);
        }
        return () => (<select v-on-change={onChange} class="markdown-style-selector">
                {cssKeys.map((css) => {
                return (<option v-model-selected={css === (defaultStyle.value || HljsStyleEnums['github-dark'])} v-text={css}></option>);
            })}

            </select>);
    },
});
export default MdStyleSelector;

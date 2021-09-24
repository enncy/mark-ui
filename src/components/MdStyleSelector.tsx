import { PropType, defineComponent, toRefs } from 'vue';
import HljsStyleEnums from "../types/hljs-style-enum";
import { HljsStyleTypes } from "../types/hljs-style-types";
import hljsCss from "../generator/hljs-css.json";



export const MdStyleSelector = defineComponent({
    name: 'MdStyleSelector',
    props: {
        defaultStyle: {
            type: String as PropType<keyof HljsStyleTypes>,
            default: '',
        }
    },
    emits: ['styleChange'],
    setup(props, { slots, attrs, emit }) {
        const { defaultStyle } = toRefs(props)

        const cssKeys: string[] = hljsCss.styles;

        function onChange(e: any) {
            emit("styleChange", e.target.value);
        }
        return () => (
            <select v-on-change={onChange} class="markdown-style-selector">
                {
                    cssKeys.map((css: string) => {
                        return (
                            <option
                                v-model-selected={css === (defaultStyle.value || HljsStyleEnums['github-dark'])}
                                v-text={css}
                            ></option>
                        )
                    })}

            </select >
        );
    },
});

export default MdStyleSelector
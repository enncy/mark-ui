import { PropType } from 'vue';
import { HljsStyleTypes } from "../types/hljs-style-types";
export declare const MdStyleSelector: import("vue").DefineComponent<{
    defaultStyle: {
        type: PropType<keyof HljsStyleTypes>;
        default: string;
    };
}, () => JSX.Element, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, "styleChange"[], "styleChange", import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<{
    defaultStyle?: unknown;
} & {
    defaultStyle: keyof HljsStyleTypes;
} & {}> & {
    onStyleChange?: ((...args: any[]) => any) | undefined;
}, {
    defaultStyle: keyof HljsStyleTypes;
}>;
export default MdStyleSelector;

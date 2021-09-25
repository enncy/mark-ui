import { HljsStyleTypes } from '../../types/hljs-style-types';
import { PropType } from 'vue';
import HljsStyleEnums from "../../types/hljs-style-enum";
export declare const MdRender: import("vue").DefineComponent<{
    content: {
        type: StringConstructor;
        default: string;
        required: false;
    };
    codeStyle: {
        type: PropType<keyof HljsStyleTypes>;
        default: HljsStyleEnums;
        required: false;
    };
    raw: {
        type: BooleanConstructor;
        default: boolean;
        required: false;
    };
}, () => JSX.Element, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, "copy"[], "copy", import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<{
    content?: unknown;
    codeStyle?: unknown;
    raw?: unknown;
} & {
    raw: boolean;
    content: string;
    codeStyle: keyof HljsStyleTypes;
} & {}> & {
    onCopy?: ((...args: any[]) => any) | undefined;
}, {
    raw: boolean;
    content: string;
    codeStyle: keyof HljsStyleTypes;
}>;
export default MdRender;

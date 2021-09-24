import { PropType } from 'vue';
export declare const MdEditor: import("vue").DefineComponent<{
    modelValue: StringConstructor;
    renderKeys: {
        type: PropType<(string | number)[]>;
        default: never[];
    };
}, () => JSX.Element, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("update:modelValue" | "filesUpdate")[], "update:modelValue" | "filesUpdate", import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<{
    modelValue?: unknown;
    renderKeys?: unknown;
} & {
    renderKeys: (string | number)[];
} & {
    modelValue?: string | undefined;
}> & {
    "onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
    onFilesUpdate?: ((...args: any[]) => any) | undefined;
}, {
    renderKeys: (string | number)[];
}>;
export default MdEditor;

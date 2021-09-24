import { PropType } from 'vue';
declare const _default: import("vue").DefineComponent<{
    modelValue: StringConstructor;
    renderKeys: {
        type: PropType<(string | number)[]>;
        default: never[];
    };
}, () => JSX.Element, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    "update:modelValue": null;
    filesUpdate: (files: File[]) => void;
}, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<{
    modelValue?: unknown;
    renderKeys?: unknown;
} & {
    renderKeys: (string | number)[];
} & {
    modelValue?: string | undefined;
}> & {
    "onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
    onFilesUpdate?: ((files: File[]) => any) | undefined;
}, {
    renderKeys: (string | number)[];
}>;
export default _default;

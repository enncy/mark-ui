import { HljsStyleTypes } from '../types/hljs-style-types';
declare const styles: any;
export { styles as HljsAllStyles };
export interface HljsStyleGeneratorOptions {
    selector?: string;
    styles: string[] | (keyof HljsStyleTypes)[];
    source: keyof HljsStyleSupportSources;
    version: string;
}
export interface HljsStyleSupportSources {
    cdnjs: string;
    jsDriver: string;
    unpkg: string;
}
/**
 *
 * 编译 hljs 的定制化 less ，可通过添加类到父元素使不同代码块呈现不同的样式
 * ****
 * Compile hljs' customizable less to make different markdown code blocks look different by adding classes to the parent element
 * ****
 *
 * ```html
 * <!-- add hl-xxx to parent element to show different style  -->
 * <element class="hl-github-dark">
 *  <pre class="hljs">
 *      <code></code>
 *  </pre>
 * </element>
 * ```
 *
 * @param styles styles need to generator
 * @param source 指定 cdn 源 ， 默认 jsDriver : https://unpkg.com/@highlightjs/cdn-assets@11.2.0/styles/
 */
export declare function hljsLessGenerator({ styles, source, version, selector }: HljsStyleGeneratorOptions): Promise<string>;
/**
 * use less to render hljsLessGenerator()
 * @see hljsLessGenerator
 */
export declare function hljsCssGenerator(options: HljsStyleGeneratorOptions): Promise<string>;
export declare function renderCss(css: string): Promise<string>;
/**
 * compress hljsCssGenerator()
 * @see hljsCssCompress
 */
export declare function hljsCssCompress(css: string): string;

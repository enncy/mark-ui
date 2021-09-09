import { HljsCssTypes } from '@/core/types/hljs-css-types';

import axios from 'axios';
import { defaultSource, defaultVersion, supportSources } from '@/config/hljs-css.json';
import _less from 'less';

const CDN_VERSION_REPLACEMENT = "${version}"
const STYLE_CLASS_PREFFIX = "hl";
const CSS_File_SUFFIX = ".min.css";

let task: any[] = [];



// options
export interface HljsStyleGeneratorOptions {
    styles: string[] | (keyof HljsCssTypes)[],
    source:  keyof HljsStyleSupportSources,
    version: string
}

// support cdn source
export interface HljsStyleSupportSources {
    cdnjs: string,
    jsDriver: string,
    unpkg: string
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
export async function hljsLessGenerator({ styles = ["default"], source = "jsDriver", version = defaultVersion }: HljsStyleGeneratorOptions): Promise<string> {
    styles.forEach(style => {
        const source_resolve = (supportSources as any)[source].replace(CDN_VERSION_REPLACEMENT, version)
        const cdn = source_resolve + style + CSS_File_SUFFIX
       ;
        
        task.push(new Promise(async (resolve, reject) => {
            axios.get(cdn).then((result) => {
                resolve(`.${STYLE_CLASS_PREFFIX}-${style.replace('/', '-')} {
                            ${result.data}
                        }`)
            }).catch((err) => {
                reject(err)
            });

        }))
    })
    const results = await Promise.all(task)
    return results.join("");
}

/**
 * use less to render hljsLessGenerator()
 * @see hljsLessGenerator
 */
export async function hljsCssGenerator(options: HljsStyleGeneratorOptions): Promise<string> {
    const css = await hljsLessGenerator(options)
    return (await _less.render(css)).css
}

/**
 * compress hljsCssGenerator()
 * @see hljsCssGenerator
 */
export async function hljsCssMinGenerator(options: HljsStyleGeneratorOptions): Promise<string> {
    const css = await hljsLessGenerator(options)
    return css.replace(/\/\*{1,2}([\s\S])*?\*\//g, '').replace(/ +/g, ' ').replace(/\n/g, '')
}


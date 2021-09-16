import { HljsStyleTypes } from '../types/hljs-style-types';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
const { defaultVersion, supportSources, styles } = JSON.parse(fs.readFileSync(path.resolve("./lib/generator/hljs-css.json")).toString())
import chalk from 'chalk';
import ora from 'ora';
import _less from 'less';

const CDN_VERSION_REPLACEMENT = "${version}"
const STYLE_CLASS_PREFFIX = "hl";
const CSS_File_SUFFIX = ".min.css";

export { styles as HljsAllStyles }

// options
export interface HljsStyleGeneratorOptions {
    selector?: string,
    styles: string[] | (keyof HljsStyleTypes)[],
    source: keyof HljsStyleSupportSources,
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
export async function hljsLessGenerator({ styles = ["default"], source = "jsDriver", version = defaultVersion, selector }: HljsStyleGeneratorOptions): Promise<string> {
    console.clear()
    console.log('✨ hljs-css-generator runnning! \n');
    console.log('source :\t' + source);
    console.log('version:\t' + version);
    console.log('styles :\t' + styles.slice(0, 5) + ' ...' + styles.length + ' more');
    const spinner = ora(chalk.blueBright(`[hljs-css-generator]: `) + 'solving').start();
    let result = ""
    for (const style of styles) {
        const source_resolve = (supportSources as any)[source].replace(CDN_VERSION_REPLACEMENT, version)
        const cdn = source_resolve + style + CSS_File_SUFFIX;

        spinner.text = chalk.blueBright(`[hljs-css-generator]: `) + 'solving - ' + style

        const _selector = selector || "." + STYLE_CLASS_PREFFIX + "-" + style.replace('/', '-')
        const r = await axios.get(cdn)
        result += `${_selector}{
            ${r.data}
        }`
    }
    spinner.stop()
    console.log('\n ✨ hljs-css-generator finsh! \n');
    return result;
}

/**
 * use less to render hljsLessGenerator()
 * @see hljsLessGenerator
 */
export async function hljsCssGenerator(options: HljsStyleGeneratorOptions): Promise<string> {
    const css = await hljsLessGenerator(options)
    return await renderCss(css)
}

export async function renderCss(css: string) {
    return (await _less.render(css)).css
}


/**
 * compress hljsCssGenerator()
 * @see hljsCssCompress
 */
export function hljsCssCompress(css: string): string {
    return css.replace(/\/\*{1,2}([\s\S])*?\*\//g, '').replace(/ +/g, ' ').replace(/\n+/g, '\n')
}



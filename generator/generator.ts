import { hljsLessGenerator, renderCss, hljsCssCompress, HljsAllStyles } from "./hljs-css-generator.js";

import path from 'path';
import fs from 'fs';

// hljs 样式代码生成器
(async () => {

    const common_less = await hljsLessGenerator({
        styles: HljsAllStyles.filter((s: string) => s.indexOf('base16') === -1),
        source: "jsDriver",
        version: "11.2.0"
    });
    // 渲染 css 文件
    const common_css = await renderCss(common_less)
    // css 压缩
    const common_compressCss = hljsCssCompress(common_css)


    fs.writeFileSync(path.resolve('./src/assets/css/hljs-common.less'), common_less)
    fs.writeFileSync(path.resolve('./src/assets/css/hljs-common.css'), common_css)
    fs.writeFileSync(path.resolve('./src/assets/css/hljs-common.min.css'), common_compressCss)

    const base16_less = await hljsLessGenerator({
        styles: HljsAllStyles.filter((s: string) => s.indexOf('base16') !== -1),
        source: "jsDriver",
        version: "11.2.0"
    });
    // 渲染 css 文件
    const base16_css = await renderCss(base16_less)
    // css 压缩
    const base16_compressCss = hljsCssCompress(base16_css)

    fs.writeFileSync(path.resolve('./src/assets/css/hljs-base16.less'), base16_less)
    fs.writeFileSync(path.resolve('./src/assets/css/hljs-base16.css'), base16_css)
    fs.writeFileSync(path.resolve('./src/assets/css/hljs-base16.min.css'), base16_compressCss)

    // 合并文件

    fs.writeFileSync(path.resolve('./src/assets/css/hljs.less'), common_less + base16_less)
    fs.writeFileSync(path.resolve('./src/assets/css/hljs.css'), common_css + base16_css)
    fs.writeFileSync(path.resolve('./src/assets/css/hljs.min.css'), common_compressCss + base16_compressCss)


})()
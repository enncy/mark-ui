import hljs from "highlight.js";
import Emoji from "markdown-it-emoji";
import Container from "@/core/plugins/container";
import Anchor from "markdown-it-anchor";
import TocDoneRight from "markdown-it-toc-done-right";
import MarkdownIt from "markdown-it";
import hljsCss from "@/generator/hljs-css.json";
import ShowLine from "./plugins/show.line";
const cssKeys = hljsCss.styles;
let id = 0;
// 初始化 markdown
const markdown = MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
    // 高亮
    highlight: function (str, lang, attrs) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                const value = hljs.highlight(lang, str, true).value;
                // 选项遍历
                const selectOptions = cssKeys.map(k => `<option  ${k === "github-dark" ? 'selected' : ''}  value="${k}">${k}</option>`);
                // 行数遍历
                const count = str.match(/\n/g)?.length;
                const arr = Array.from(new Array(count)).map((v, i) => `<div>${i + 1}</div>`);
                return (`<pre data-code-key="${id}"><code class="language-${lang}" >` +
                    `<div class="markdown-code" >` +
                    `<div>` +
                    `<div class="line-suffix hljs">` +
                    `<span class="code-css-selector"><select  data-selector-key="${id++}">${selectOptions.join("")}</select></span>` +
                    `<span class="code-copy">复制</span>` +
                    `<span class="code-lang">${lang}</span>` +
                    `</div>` +
                    `<div class="block-code">` +
                    `<code class="hljs">` +
                    `<div class="line-count">` +
                    `${arr.join("")}` +
                    `</div>` +
                    `<div class="code-render">${value}</div>` +
                    `</code>` +
                    `</div>` +
                    `</div>` +
                    `</div>` +
                    `</code></pre>`);
            }
            catch (__) { }
        }
        return `<pre class="hljs"><code>${markdown.utils.escapeHtml(str)}</code></pre>`;
    },
});
markdown
    // emoji 表情
    .use(Emoji)
    // 自定义 container
    .use(Container)
    // 锚点
    .use(Anchor, {
    permalink: true,
    permalinkBefore: true,
    // 锚点标识
    permalinkSymbol: "#",
})
    // toc 目录生成 ${toc}
    .use(TocDoneRight, {
    // 样式覆盖
    itemClass: "toc-li",
    // 无序
    listType: "ul",
    // 格式化
    format(x, htmlencode) {
        return ` <span>${htmlencode(x)}</span> `;
    },
})
    // 展示所在的行数
    .use(ShowLine);
export default markdown;

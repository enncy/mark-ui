import hljs from "highlight.js";
import Emoji from "markdown-it-emoji";
import Container from "@/core/container";
import Anchor from "markdown-it-anchor";
import TocDoneRight from "markdown-it-toc-done-right";
import MarkdownIt from "markdown-it";
 

// 初始化 markdown
const markdown: MarkdownIt = MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
    // 高亮
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                const value = hljs.highlight(lang, str, true).value;

                const count = str.match(/\n/g)?.length;
                const arr = Array.from(new Array(count)).map((v, i) => `<div>${i + 1}</div>`);
                return (
                    `<div class="block-code">`+
                        `<div>`+
                            `<div class="line-suffix">`+
                                `<span class="code-copy">复制</span>`+
                                `<span class="code-lang">${lang}</span>`+
                            `</div>`+
                            `<div>`+
                                `<pre class="hljs">`+
                                    `<div class="line-count">` +
                                        `${arr.join("")}` +
                                    `</div>`+
                                    `<code >${value}</code>`+
                                `</pre>`+
                            `</div>`+
                        `</div>`+
                    `</div>`
                );
            } catch (__) { }
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
        format(x: any, htmlencode: any) {
            return ` <span>${htmlencode(x)}</span> `;
        },
    });


export default markdown


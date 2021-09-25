import { nextTick } from '@vue/runtime-core';
import markdown from '../../markdown';
import { DATA_CODE_KEY, DATA_LINE_START } from '../../types/dom-attributes-data-set';
import { DATA_SELECTOR_KEY } from "../../types/dom-attributes-data-set";

export function getRender(renderKey: any) {
    // 当前对象，如果未指定则获取第一个类为 ".markdown-body" 的对象
    const render: any = document.querySelector(
        renderKey
            ? `[data-render-key='${renderKey}']`
            : ".markdown-body"
    );

    return render;
}

export function resolveRaw(render: any) {

    // 获取 html ， 如果有 pre 子节点，优先获取 pre 的
    let html: string = render?.querySelector('pre').innerHTML || render?.innerHTML
    // 格式化 html
    html = formatPreElementContent(html)

    return markdown.render(html || "")
}



// 高度变量的缓存
let temp_offsetHeight = -1;


/**
 * 滚动到指定的行数
 * @param target  指定的 markdown render 元素
 * @param change_line  该行数取自于 data-line-xxx
 * @returns 
 */
export function scrollToLine(target: any, change_line: number): boolean {

    // 根据被改动的行进行高度调整
    const els: any[] = Array.from(
        document.querySelectorAll(`[${DATA_LINE_START}]`)
    );
    for (const el of els) {
        const start = el.dataset.lineStart;
        const end = el.dataset.lineEnd;

        if (start <= change_line && change_line <= end && temp_offsetHeight !== el?.offsetTop) {
            // 防抖
            temp_offsetHeight = el?.offsetTop;

            // 滑动到改动的地方，并在最中间
            target.scrollTo({
                behavior: "smooth",
                top:
                    el?.offsetTop > target.offsetHeight
                        ? el?.offsetTop - target.offsetHeight / 2
                        : 0,
            });

            return true;
        }
    }

    return false;
}


/**
 * 格式化 \<pre\> 元素中的制表符内容，使得每一行的制表符数量都尽量最小
 * ****
 * 例如
 * ```js
 * formatPreElementContent(`\t\t\thello word
 * \t\thi,i am li hua
 * \thow s going`)
 * ```
 * 将返回
 * ```js
 * `\t\thello word
 * \thi,i am li hua
 * how s going`
 * ```
 * 
 * @param content 
 */
export function formatPreElementContent(content: string): string {
    let res: any = content
    let tabInfo: any[] = []
    let min = 0


    // 收集每行的制表符数量
    res = res.split("\n")
    res.forEach((line: string, i: number) => {
        if (line.replace(/\s+/g, "") !== "") {
            tabInfo.push({
                count: line.match(/^(    |\t)+/g)?.[0].match(/(    |\t)/g)?.length || 0,
                index: i
            })
        }
    })
    console.log("tabCount", tabInfo);
    // 找到最小公共制表符

    min = minCount(tabInfo.map(t => t.count))
    // 使每一行的开头为最小数量的制表符

    tabInfo.forEach(info => {
        res[info.index] = "\t".repeat(info.count - min) + res[info.index].replace(/(    |\t)+/g, '')
    })
    res = res.join("\n")


    function minCount(arr: any[]) {
        let base = arr[0]
        for (let i = 1; i < arr.length; i++) {
            base = Math.min(base, arr[i])
        }
        return base
    }

    return res
}


/**
 * 颜色修改
 */
export function autoChangeStyle(render: any) {

    const selects: HTMLSelectElement[] = Array.from(
        render.querySelectorAll("[" + DATA_SELECTOR_KEY + "]")
    );

    if (selects.length !== 0) {
        selects.forEach((select) => {
            select.style.width = select.value.length * 6 + 40 + "px";
            // 根据选项修改样式，并且自动适配选项的宽度
            select.onchange = function (e) {
                select.style.width = select.value.length * 6 + 40 + "px";
                changeStyle(select);
            };
        });
    }
}

/**
 * 处理<code/>代码的悬浮窗复制工具
 * @param render 渲染器dom对象
 * @param copyHandler 回调函数
 */
export function contentCopy( render: any, copyHandler?: (value: string) => void) {
    const codes = Array.from(render.querySelectorAll('[class*=language]'))

    codes.forEach((code: any) => {
        const codeRender: HTMLDivElement = code.querySelector(".code-render")
        const copyEl: HTMLSpanElement = code.querySelector(".code-copy")
        if (copyEl) {
            copyEl.onclick = function () {
                navigator.clipboard.writeText(codeRender?.innerText || '')
                copyHandler?.(codeRender?.innerText || '')
            }
        }

    })
}

/**
 * 更改颜色 data-selector-key 和 data-code-key 绑定 2个的值是互相相同且唯一的
 * @param select HTMLSelectElement
 */
export function changeStyle(select: HTMLSelectElement) {
    // 获取绑定的 selector key
    const key = select.getAttribute(DATA_SELECTOR_KEY);

    const list: DOMTokenList | undefined = document.querySelector(
        `[${DATA_CODE_KEY}="${key}"]`
    )?.classList;
    const classes = list?.value?.split(" ");

    // 如果元素已经有了样式，则删除
    if (classes?.some((c) => /hl-/.test(c))) {
        list?.remove(classes?.find((c) => /hl-/.test(c)) || "");
    }
    // 添加选中的样式
    list?.add("hl-" + select.value.replace("/", "-"));
}
import { DATA_CODE_KEY, DATA_LINE_START } from '@/types/dom-attributes-data-set';
import { DATA_SELECTOR_KEY } from "@/types/dom-attributes-data-set";


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
 * 颜色修改
 */
export function autoChangeStyle() {
    const selects: HTMLSelectElement[] = Array.from(
        document.querySelectorAll("[" + DATA_SELECTOR_KEY + "]")
    );

    if (selects) {
        selects.forEach((select) => {
            // 根据选项修改样式，并且自动适配选项的宽度
            select.onchange = function (e) {
                select.style.width = select.value.length * 6 + 50 + "px";
                changeStyle(select);
            };
        });
    }
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
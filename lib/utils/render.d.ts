/**
 * 滚动到指定的行数
 * @param target  指定的 markdown render 元素
 * @param change_line  该行数取自于 data-line-xxx
 * @returns
 */
export declare function scrollToLine(target: any, change_line: number): boolean;
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
export declare function formatPreElementContent(content: string): string;
/**
 * 颜色修改
 */
export declare function autoChangeStyle(): void;
/**
 * 更改颜色 data-selector-key 和 data-code-key 绑定 2个的值是互相相同且唯一的
 * @param select HTMLSelectElement
 */
export declare function changeStyle(select: HTMLSelectElement): void;

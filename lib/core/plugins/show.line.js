/**
 * 在被渲染的元素上显示 data-line-start 和 data-line-end 属性
 * @param md
 */
export default function ShowLine(md) {
    md.core.ruler.push('show-line-rule', (state) => {
        //...
        state.tokens.forEach(token => {
            // token.map 即所在的行数
            if (token.map) {
                const start = ["data-line-start", token.map[0].toString()];
                const end = ["data-line-end", token.map[1].toString()];
                token.attrs = token.attrs || [];
                token.attrs.push(start, end);
            }
        });
        return true;
    });
}

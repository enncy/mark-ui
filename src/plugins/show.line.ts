import Token from 'markdown-it/lib/token';
import MarkdownIt from "markdown-it/lib";
import { DATA_LINE_END, DATA_LINE_START } from '../types/dom-attributes-data-set';


/**
 * 在被渲染的元素上显示 开始行 和 结束行 的属性
 * @param md 
 */
export default function ShowLine(md: MarkdownIt) {

    function show(state: any) {
        //...

        state.tokens.forEach((token: Token) => {
            // token.map 即所在的行数
            function eachLine(token: Token) {
                if (token.children) {

                    token.children.forEach((child, i) => {
                        if (token.map) {
                            child.map = [token.map[0] + i, token.map[0] + i + 1]
                        }
                        eachLine(child)
                    })
                }
                else if (token.map) {
                    const start: [string, string] = [DATA_LINE_START, token.map[0].toString()]
                    const end: [string, string] = [DATA_LINE_END, token.map[1].toString()]
                    token.attrs = token.attrs || []
                    token.attrs.push(start, end)
                }
            }

            eachLine(token)

        })
        return true;
    }
 
    md.core.ruler.push('show-line-rule', show);
    md.core.ruler.before('show-line-rule', 'code', show);


}
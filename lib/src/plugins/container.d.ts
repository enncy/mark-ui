import MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token";
export default function (md: MarkdownIt): void;
/**
 * 创建通用容器的模板函数
 * @param name 容器名
 */
export declare function createCommonContainer(md: MarkdownIt, name: string | CommonContainerNames): void;
export declare function createContainer({ md, name, renders, maker }: {
    md: MarkdownIt;
    name: string | CommonContainerNames;
    renders: RenderOptions;
    maker?: string;
}): void;
export interface RenderOptions {
    open: (tokens: Token[], idx: number) => string;
    close: (tokens: Token[], idx: number) => string;
}
export declare enum CommonContainerNames {
    INFO = "info",
    WARNING = "warning",
    SUCCESS = "success",
    ERROR = "error"
}

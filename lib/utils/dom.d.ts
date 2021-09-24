/**
 * 滑动绑定
 * @param origin 绑定源，当此元素滑动之后，被绑定的另外一个元素 `target` 跟着滑动
 * @param target 目标元素
 * @param behavior 滑动效果 : 'auto' | 'smooth'
 */
export declare function scrollBind({ origin, target, behavior }: {
    origin: HTMLElement;
    target: HTMLElement;
    behavior: ScrollBehavior;
}): void;



/**
 * 滑动绑定
 * @param origin 绑定源，当此元素滑动之后，被绑定的另外一个元素 `target` 跟着滑动
 * @param target 目标元素
 * @param behavior 滑动效果 : 'auto' | 'smooth'
 */
export function scrollBind({ origin, target, behavior = "auto" }: { origin: HTMLElement, target: HTMLElement, behavior: ScrollBehavior }) {

    // 计算有效高
    const validHeight = origin.scrollHeight - origin.clientHeight;
    // 百分比计算
    const rate = origin.scrollTop / validHeight;

    target.scrollTo({
        behavior,
        top: target.scrollHeight * rate,
    });
}





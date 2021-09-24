/**
 * 解决 textarea 文本域制表符 为 默认切换元素问题
 * @param e
 */
export function resolveTabKeyDown(e) {
    if (e.code === "Tab" || e.key === "Tab" || e.keyCode === 9) {
        e.preventDefault();
        const text = e.target;
        let start = text.selectionStart;
        let end = text.selectionEnd;
        text.value =
            text.value.substring(0, start) +
                "\t" +
                text.value.substring(end, text.value.length);
        text.selectionStart = start + 1;
        text.selectionEnd = end + 1;
    }
}
/**
 * 文本域 textarea 文件拖入解决
 */
export function resolveFiesUpdate(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e?.dataTransfer?.files) {
        // 遍历文件返回给父组件
        const filelist = e.dataTransfer.files;
        const files = [];
        if (filelist) {
            for (let i = 0; i < filelist.length; i++) {
                const file = filelist.item(i);
                if (file !== null) {
                    files.push(file);
                }
            }
        }
        return files;
    }
    return [];
}
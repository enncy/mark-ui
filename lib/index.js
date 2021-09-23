import { MdStyleSelector, MdRender, MdEditor } from './src/main';
export default function MarkUI(app, ...options) {
    app.component('MdStyleSelector', MdStyleSelector);
    app.component('MdRender', MdRender);
    app.component('MdEditor', MdEditor);
}

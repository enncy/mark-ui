import MdEditor from './components/MdEditor/MdEditor';
import MdRender from './components/MdRender/MdRender';
import './assets/css/markdown.css';
import HljsStyleEnums from './types/hljs-style-enum';
export { HljsStyleEnums };
export { default as MdEditor } from './components/MdEditor/MdEditor';
export { default as MdRender } from './components/MdRender/MdRender';
export default function MarkUI(app, ...options) {
    app.component('MdRender', MdRender);
    app.component('MdEditor', MdEditor);
}

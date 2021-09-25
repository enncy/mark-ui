import { App } from 'vue';
import './assets/less/markdown.less';
import HljsStyleEnums from './types/hljs-style-enum';
export { HljsStyleEnums };
export { default as MdEditor } from './components/MdEditor/MdEditor';
export { default as MdRender } from './components/MdRender/MdRender';
export default function MarkUI(app: App, ...options: any[]): void;

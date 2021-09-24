import { App } from 'vue';
import './assets/css/markdown.css';
import HljsStyleEnums from './types/hljs-style-enum';
export { HljsStyleEnums };
export { default as MdEditor } from './components/MdEditor';
export { default as MdRender } from './components/MdRender';
export { default as MdStyleSelector } from './components/MdStyleSelector';
export default function MarkUI(app: App, ...options: any[]): void;

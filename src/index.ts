import { App } from 'vue';
import MdEditor from './components/MdEditor/MdEditor';
import MdRender from './components/MdRender/MdRender';
 

import './assets/less/markdown.less';

import HljsStyleEnums from './types/hljs-style-enum';

export { HljsStyleEnums }

export { default as MdEditor } from './components/MdEditor/MdEditor';
export { default as MdRender } from './components/MdRender/MdRender';
 



export default function MarkUI(app: App, ...options: any[]): void {

    app.component('MdRender', MdRender)
    app.component('MdEditor', MdEditor)

}
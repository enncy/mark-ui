import { App } from 'vue';
import MdEditor from './components/MdEditor';
import MdRender from './components/MdRender';
import MdStyleSelector from './components/MdStyleSelector';

import HljsStyleEnums from './types/hljs-style-enum';

export { HljsStyleEnums }

export { default as MdEditor } from './components/MdEditor';
export { default as MdRender } from './components/MdRender';
export { default as MdStyleSelector } from './components/MdStyleSelector';



export default function MarkUI(app: App, ...options: any[]): void {
    app.component('MdStyleSelector', MdStyleSelector)
    app.component('MdRender', MdRender)
    app.component('MdEditor', MdEditor)

}
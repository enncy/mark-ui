import { App } from 'vue';
import { MdStyleSelector, MdRender, MdEditor } from './src/main';


export default function MarkUI(app: App, ...options: any[]): void {
    app.component('MdStyleSelector', MdStyleSelector)
    app.component('MdRender', MdRender)
    app.component('MdEditor', MdEditor)

}
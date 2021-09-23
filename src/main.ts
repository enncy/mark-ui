import { createApp } from 'vue'
import App from './App.vue'
import MdEditor from './components/MdEditor.vue';
import MdRender from './components/MdRender.vue';
import MdStyleSelector from './components/MdStyleSelector.vue';
export  { MdEditor, MdRender, MdStyleSelector } 

const app = createApp(App)
 
app.mount('#app')


import { createApp } from 'vue'
import App from './App.vue'
import { hljsCssGenerator } from './utils/hljs-css-generator'


(async () => {
    console.log(
       await  hljsCssGenerator({
            styles: ["default"],
            source: "jsDriver",
            version: "11.2.0"
        }));

})()

createApp(App).mount('#app')

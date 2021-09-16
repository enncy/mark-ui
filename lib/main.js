import { createApp } from 'vue';
import App from './App.vue';
const app = createApp(App);
app.use((app, ...options) => {
    console.log(app);
});
app.mount('#app');

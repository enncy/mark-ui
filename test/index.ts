
import sfc from '@vue/compiler-sfc';
import fs from 'fs';
import path from 'path';
const res = sfc.parse(fs.readFileSync(path.resolve('./src/App.vue')).toString())

console.log(sfc.compileScript(res.descriptor, { id: '1' }));
console.log(sfc.compileTemplate({
    source: res?.descriptor?.template?.content || '',
    filename: '2',
    id: '3'
}));

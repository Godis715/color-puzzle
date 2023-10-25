const t=encodeURIComponent("4.1.1");let e={workerURL:new URL(`./minizinc-worker.js?version=${t}`,import.meta.url),numWorkers:2};const n=[];let s;function o(){if(!s){const t=`importScripts(${JSON.stringify(e.workerURL)});`;s=URL.createObjectURL(new Blob([t],{type:"text/javascript"}))}const o=new Worker(s);o.postMessage({wasmURL:e.wasmURL?e.wasmURL.toString():new URL(`./minizinc.wasm?version=${t}`,e.workerURL).toString(),dataURL:e.dataURL?e.dataURL.toString():new URL(`./minizinc.data?version=${t}`,e.workerURL).toString()}),n.push({worker:o,runCount:0})}function r(){for(;n.length<e.numWorkers;)o()}async function a(t){if(t&&(e={...e,...t}),n.length>0)throw new Error("MiniZinc.init() called after library already used/initialised");r(),await Promise.race(n.map((t=>new Promise((e=>{t.worker.addEventListener("message",(t=>{"ready"===t.data.type&&e()}),{once:!0})})))))}function i(){for(const t of n)t.worker.terminate();n.splice(0),URL.revokeObjectURL(s),s=null}class u{constructor(){this.vfs={},this._toRun=[],this.unnamedCount=0}clone(){const t=new u;return t.vfs={...this.vfs},t._toRun=[...this.toRun],t.unnamedCount=this.unnamedCount,t}addString(t){let e=`_mzn_${this.unnamedCount++}.mzn`;for(;e in this.vfs;)e=`_mzn_${this.unnamedCount++}.mzn`;return this.addFile(e,t),e}addDznString(t){let e=`_dzn_${this.unnamedCount++}.dzn`;for(;e in this.vfs;)e=`_dzn_${this.unnamedCount++}.dzn`;return this.addFile(e,t),e}addJson(t){let e=`_json_${this.unnamedCount++}.json`;for(;e in this.vfs;)e=`_json_${this.unnamedCount++}.json`;return this.addFile(e,JSON.stringify(t)),e}addFile(t,e,n=!0){if("string"!=typeof e){if(t in this.vfs)return void this._addToRun(t,n);throw new Error("Missing file contents argument")}this.vfs[t]=e,this._addToRun(t,n)}_addToRun(t,e){e&&(t.endsWith(".mzn")||t.endsWith(".mzc")||t.endsWith(".dzn")||t.endsWith(".json")||t.endsWith(".mpc")||t.endsWith(".fzn"))&&-1===this._toRun.indexOf(t)&&this._toRun.push(t)}_run(t,e,s=null){r();const o=[];let a=this.vfs;if(e){let t=`_mzn_${this.unnamedCount++}.mpc`;for(;t in this.vfs;)t=`_mzn_${this.unnamedCount++}.mpc`;a={...this.vfs,[t]:JSON.stringify(e)},o.push(t)}let{worker:i,runCount:u}=n.pop();return i.postMessage({jsonStream:!0,files:a,args:[...o,...t,...this._toRun],outputFiles:s}),{worker:i,runCount:u+1}}check(t){return new Promise(((e,s)=>{const r={...t},{worker:a,runCount:i}=this._run(["--model-check-only"],r.options),u=[];a.onmessage=t=>{switch(t.data.type){case"error":u.push(t.data);break;case"exit":i<10?n.push({worker:a,runCount:i}):(a.terminate(),o()),e(u)}}}))}interface(t){return new Promise(((e,s)=>{const r={...t},{worker:a,runCount:i}=this._run(["-c","--model-interface-only"],r.options),u=[];let d=null;a.onmessage=t=>{switch(t.data.type){case"error":u.push(t.data);break;case"interface":d=t.data;break;case"exit":i<10?n.push({worker:a,runCount:i}):(a.terminate(),o()),0===t.data.code?e(d):s(u)}}}))}compile(t){const e={...t};let n=0,s=`_fzn_${n++}.fzn`;for(;s in this.vfs;)s=`_fzn_${n++}.fzn`;const r=["-c","--fzn",s],{worker:a}=this._run(r,e.options,[s]);o();let i={},u=!1,d=null;return a.onmessage=t=>{if(i[t.data.type])for(const e of i[t.data.type])e(t.data);switch(t.data.type){case"exit":a.terminate(),u=!0,i={};break;case"error":d||(d=t.data)}},{isRunning:()=>!u,cancel(){if(!u){if(u=!0,a.terminate(),i.exit)for(const t of i.exit)t({type:"exit",code:null});i={}}},on(t,e){i[t]?i[t].add(e):i[t]=new Set([e])},off(t,e){i[t]&&i[t].delete(e)},then(t,e){const n=n=>{if(0===n.code)t(n.outputFiles[s]);else{const t=d?{message:d.message,...n}:n;if(!e)throw t;e(t)}};i.exit?i.exit.add(n):i.exit=new Set([n])}}}solve(t){const e={jsonOutput:!0,...t},n=["-i"];e.jsonOutput&&(n.push("--output-mode"),n.push("json"));const{worker:s}=this._run(n,e.options);o();let r=null,a={},i=!1,u=null,d={},c="UNKNOWN";return s.onmessage=t=>{if(a[t.data.type])for(const e of a[t.data.type])e(t.data);switch(t.data.type){case"exit":s.terminate(),i=!0,a={};break;case"error":r||(r=t.data);break;case"statistics":d={...d,...t.data.statistics};break;case"solution":u=t.data,c="SATISFIED";break;case"status":c=t.data.status}},{isRunning:()=>!i,cancel(){if(!i){if(i=!0,s.terminate(),a.exit)for(const t of a.exit)t({type:"exit",code:null});a={}}},on(t,e){a[t]?a[t].add(e):a[t]=new Set([e])},off(t,e){a[t]&&a[t].delete(e)},then(t,e){const n=n=>{if(0===n.code)t({status:c,solution:u,statistics:d});else{const t=r?{message:r.message,...n}:n;if(!e)throw t;e(t)}};a.exit?a.exit.add(n):a.exit=new Set([n])}}}}function d(){return new Promise(((t,e)=>{r();let{worker:s,runCount:a}=n.pop();s.postMessage({jsonStream:!1,args:["--version"]}),s.onmessage=r=>{"exit"===r.data.type&&(a<10?n.push({worker:s,runCount:a+1}):(s.terminate(),o()),0===r.data.code?t(r.data.stdout):e(r.data))}}))}function c(){return new Promise(((t,e)=>{r();let{worker:s,runCount:a}=n.pop();s.postMessage({jsonStream:!1,args:["--solvers-json"]}),s.onmessage=r=>{"exit"===r.data.type&&(a<10?n.push({worker:s,runCount:a+1}):(s.terminate(),o()),0===r.data.code?t(JSON.parse(r.data.stdout)):e(r.data))}}))}function m(t){const e=Array.isArray(t)?t:[t];return new Promise(((s,a)=>{r();let{worker:i,runCount:u}=n.pop();i.postMessage({readStdlibFiles:e}),i.onmessage=e=>{"readStdlibFiles"===e.data.type?(u<10?n.push({worker:i,runCount:u+1}):(i.terminate(),o()),Array.isArray(t)?s(e.data.files):s(e.data.files[t])):"error"===e.data.type&&(i.terminate(),o(),a(e.data.message))}}))}export{u as Model,a as init,m as readStdlibFileContents,i as shutdown,c as solvers,d as version};

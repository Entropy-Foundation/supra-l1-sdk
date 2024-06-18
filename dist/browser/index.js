"use strict";var ie=Object.defineProperty;var yt=Object.getOwnPropertyDescriptor;var gt=Object.getOwnPropertyNames;var bt=Object.prototype.hasOwnProperty;var Ne=(e,t)=>{for(var r in t)ie(e,r,{get:t[r],enumerable:!0})},xt=(e,t,r,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let s of gt(t))!bt.call(e,s)&&s!==r&&ie(e,s,{get:()=>t[s],enumerable:!(n=yt(t,s))||n.enumerable});return e};var wt=e=>xt(ie({},"__esModule",{value:!0}),e);var wr={};Ne(wr,{SupraClient:()=>Ce,TransactionStatus:()=>_e});module.exports=wt(wr);var y=require("aptos");function q(e,t){return function(){return e.apply(t,arguments)}}var{toString:Et}=Object.prototype,{getPrototypeOf:ce}=Object,K=(e=>t=>{let r=Et.call(t);return e[r]||(e[r]=r.slice(8,-1).toLowerCase())})(Object.create(null)),T=e=>(e=e.toLowerCase(),t=>K(t)===e),G=e=>t=>typeof t===e,{isArray:U}=Array,k=G("undefined");function St(e){return e!==null&&!k(e)&&e.constructor!==null&&!k(e.constructor)&&R(e.constructor.isBuffer)&&e.constructor.isBuffer(e)}var Be=T("ArrayBuffer");function At(e){let t;return typeof ArrayBuffer!="undefined"&&ArrayBuffer.isView?t=ArrayBuffer.isView(e):t=e&&e.buffer&&Be(e.buffer),t}var Rt=G("string"),R=G("function"),De=G("number"),X=e=>e!==null&&typeof e=="object",Tt=e=>e===!0||e===!1,$=e=>{if(K(e)!=="object")return!1;let t=ce(e);return(t===null||t===Object.prototype||Object.getPrototypeOf(t)===null)&&!(Symbol.toStringTag in e)&&!(Symbol.iterator in e)},Ot=T("Date"),Pt=T("File"),_t=T("Blob"),Ct=T("FileList"),Nt=e=>X(e)&&R(e.pipe),Ft=e=>{let t;return e&&(typeof FormData=="function"&&e instanceof FormData||R(e.append)&&((t=K(e))==="formdata"||t==="object"&&R(e.toString)&&e.toString()==="[object FormData]"))},Ut=T("URLSearchParams"),Bt=e=>e.trim?e.trim():e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,"");function H(e,t,{allOwnKeys:r=!1}={}){if(e===null||typeof e=="undefined")return;let n,s;if(typeof e!="object"&&(e=[e]),U(e))for(n=0,s=e.length;n<s;n++)t.call(null,e[n],n,e);else{let i=r?Object.getOwnPropertyNames(e):Object.keys(e),o=i.length,u;for(n=0;n<o;n++)u=i[n],t.call(null,e[u],u,e)}}function Ie(e,t){t=t.toLowerCase();let r=Object.keys(e),n=r.length,s;for(;n-- >0;)if(s=r[n],t===s.toLowerCase())return s;return null}var Le=typeof globalThis!="undefined"?globalThis:typeof self!="undefined"?self:typeof window!="undefined"?window:global,qe=e=>!k(e)&&e!==Le;function ue(){let{caseless:e}=qe(this)&&this||{},t={},r=(n,s)=>{let i=e&&Ie(t,s)||s;$(t[i])&&$(n)?t[i]=ue(t[i],n):$(n)?t[i]=ue({},n):U(n)?t[i]=n.slice():t[i]=n};for(let n=0,s=arguments.length;n<s;n++)arguments[n]&&H(arguments[n],r);return t}var Dt=(e,t,r,{allOwnKeys:n}={})=>(H(t,(s,i)=>{r&&R(s)?e[i]=q(s,r):e[i]=s},{allOwnKeys:n}),e),It=e=>(e.charCodeAt(0)===65279&&(e=e.slice(1)),e),Lt=(e,t,r,n)=>{e.prototype=Object.create(t.prototype,n),e.prototype.constructor=e,Object.defineProperty(e,"super",{value:t.prototype}),r&&Object.assign(e.prototype,r)},qt=(e,t,r,n)=>{let s,i,o,u={};if(t=t||{},e==null)return t;do{for(s=Object.getOwnPropertyNames(e),i=s.length;i-- >0;)o=s[i],(!n||n(o,e,t))&&!u[o]&&(t[o]=e[o],u[o]=!0);e=r!==!1&&ce(e)}while(e&&(!r||r(e,t))&&e!==Object.prototype);return t},kt=(e,t,r)=>{e=String(e),(r===void 0||r>e.length)&&(r=e.length),r-=t.length;let n=e.indexOf(t,r);return n!==-1&&n===r},Ht=e=>{if(!e)return null;if(U(e))return e;let t=e.length;if(!De(t))return null;let r=new Array(t);for(;t-- >0;)r[t]=e[t];return r},jt=(e=>t=>e&&t instanceof e)(typeof Uint8Array!="undefined"&&ce(Uint8Array)),Mt=(e,t)=>{let n=(e&&e[Symbol.iterator]).call(e),s;for(;(s=n.next())&&!s.done;){let i=s.value;t.call(e,i[0],i[1])}},vt=(e,t)=>{let r,n=[];for(;(r=e.exec(t))!==null;)n.push(r);return n},zt=T("HTMLFormElement"),Jt=e=>e.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g,function(r,n,s){return n.toUpperCase()+s}),Fe=(({hasOwnProperty:e})=>(t,r)=>e.call(t,r))(Object.prototype),Vt=T("RegExp"),ke=(e,t)=>{let r=Object.getOwnPropertyDescriptors(e),n={};H(r,(s,i)=>{let o;(o=t(s,i,e))!==!1&&(n[i]=o||s)}),Object.defineProperties(e,n)},Wt=e=>{ke(e,(t,r)=>{if(R(e)&&["arguments","caller","callee"].indexOf(r)!==-1)return!1;let n=e[r];if(R(n)){if(t.enumerable=!1,"writable"in t){t.writable=!1;return}t.set||(t.set=()=>{throw Error("Can not rewrite read-only method '"+r+"'")})}})},$t=(e,t)=>{let r={},n=s=>{s.forEach(i=>{r[i]=!0})};return U(e)?n(e):n(String(e).split(t)),r},Kt=()=>{},Gt=(e,t)=>(e=+e,Number.isFinite(e)?e:t),ae="abcdefghijklmnopqrstuvwxyz",Ue="0123456789",He={DIGIT:Ue,ALPHA:ae,ALPHA_DIGIT:ae+ae.toUpperCase()+Ue},Xt=(e=16,t=He.ALPHA_DIGIT)=>{let r="",{length:n}=t;for(;e--;)r+=t[Math.random()*n|0];return r};function Qt(e){return!!(e&&R(e.append)&&e[Symbol.toStringTag]==="FormData"&&e[Symbol.iterator])}var Zt=e=>{let t=new Array(10),r=(n,s)=>{if(X(n)){if(t.indexOf(n)>=0)return;if(!("toJSON"in n)){t[s]=n;let i=U(n)?[]:{};return H(n,(o,u)=>{let m=r(o,s+1);!k(m)&&(i[u]=m)}),t[s]=void 0,i}}return n};return r(e,0)},Yt=T("AsyncFunction"),er=e=>e&&(X(e)||R(e))&&R(e.then)&&R(e.catch),a={isArray:U,isArrayBuffer:Be,isBuffer:St,isFormData:Ft,isArrayBufferView:At,isString:Rt,isNumber:De,isBoolean:Tt,isObject:X,isPlainObject:$,isUndefined:k,isDate:Ot,isFile:Pt,isBlob:_t,isRegExp:Vt,isFunction:R,isStream:Nt,isURLSearchParams:Ut,isTypedArray:jt,isFileList:Ct,forEach:H,merge:ue,extend:Dt,trim:Bt,stripBOM:It,inherits:Lt,toFlatObject:qt,kindOf:K,kindOfTest:T,endsWith:kt,toArray:Ht,forEachEntry:Mt,matchAll:vt,isHTMLForm:zt,hasOwnProperty:Fe,hasOwnProp:Fe,reduceDescriptors:ke,freezeMethods:Wt,toObjectSet:$t,toCamelCase:Jt,noop:Kt,toFiniteNumber:Gt,findKey:Ie,global:Le,isContextDefined:qe,ALPHABET:He,generateString:Xt,isSpecCompliantForm:Qt,toJSONObject:Zt,isAsyncFn:Yt,isThenable:er};function B(e,t,r,n,s){Error.call(this),Error.captureStackTrace?Error.captureStackTrace(this,this.constructor):this.stack=new Error().stack,this.message=e,this.name="AxiosError",t&&(this.code=t),r&&(this.config=r),n&&(this.request=n),s&&(this.response=s)}a.inherits(B,Error,{toJSON:function(){return{message:this.message,name:this.name,description:this.description,number:this.number,fileName:this.fileName,lineNumber:this.lineNumber,columnNumber:this.columnNumber,stack:this.stack,config:a.toJSONObject(this.config),code:this.code,status:this.response&&this.response.status?this.response.status:null}}});var je=B.prototype,Me={};["ERR_BAD_OPTION_VALUE","ERR_BAD_OPTION","ECONNABORTED","ETIMEDOUT","ERR_NETWORK","ERR_FR_TOO_MANY_REDIRECTS","ERR_DEPRECATED","ERR_BAD_RESPONSE","ERR_BAD_REQUEST","ERR_CANCELED","ERR_NOT_SUPPORT","ERR_INVALID_URL"].forEach(e=>{Me[e]={value:e}});Object.defineProperties(B,Me);Object.defineProperty(je,"isAxiosError",{value:!0});B.from=(e,t,r,n,s,i)=>{let o=Object.create(je);return a.toFlatObject(e,o,function(m){return m!==Error.prototype},u=>u!=="isAxiosError"),B.call(o,e.message,t,r,n,s),o.cause=e,o.name=e.name,i&&Object.assign(o,i),o};var h=B;var Q=null;function le(e){return a.isPlainObject(e)||a.isArray(e)}function ze(e){return a.endsWith(e,"[]")?e.slice(0,-2):e}function ve(e,t,r){return e?e.concat(t).map(function(s,i){return s=ze(s),!r&&i?"["+s+"]":s}).join(r?".":""):t}function tr(e){return a.isArray(e)&&!e.some(le)}var rr=a.toFlatObject(a,{},null,function(t){return/^is[A-Z]/.test(t)});function nr(e,t,r){if(!a.isObject(e))throw new TypeError("target must be an object");t=t||new(Q||FormData),r=a.toFlatObject(r,{metaTokens:!0,dots:!1,indexes:!1},!1,function(d,x){return!a.isUndefined(x[d])});let n=r.metaTokens,s=r.visitor||l,i=r.dots,o=r.indexes,m=(r.Blob||typeof Blob!="undefined"&&Blob)&&a.isSpecCompliantForm(t);if(!a.isFunction(s))throw new TypeError("visitor must be a function");function p(f){if(f===null)return"";if(a.isDate(f))return f.toISOString();if(!m&&a.isBlob(f))throw new h("Blob is not supported. Use a Buffer instead.");return a.isArrayBuffer(f)||a.isTypedArray(f)?m&&typeof Blob=="function"?new Blob([f]):Buffer.from(f):f}function l(f,d,x){let w=f;if(f&&!x&&typeof f=="object"){if(a.endsWith(d,"{}"))d=n?d:d.slice(0,-2),f=JSON.stringify(f);else if(a.isArray(f)&&tr(f)||(a.isFileList(f)||a.endsWith(d,"[]"))&&(w=a.toArray(f)))return d=ze(d),w.forEach(function(_,ht){!(a.isUndefined(_)||_===null)&&t.append(o===!0?ve([d],ht,i):o===null?d:d+"[]",p(_))}),!1}return le(f)?!0:(t.append(ve(x,d,i),p(f)),!1)}let c=[],b=Object.assign(rr,{defaultVisitor:l,convertValue:p,isVisitable:le});function A(f,d){if(!a.isUndefined(f)){if(c.indexOf(f)!==-1)throw Error("Circular reference detected in "+d.join("."));c.push(f),a.forEach(f,function(w,P){(!(a.isUndefined(w)||w===null)&&s.call(t,w,a.isString(P)?P.trim():P,d,b))===!0&&A(w,d?d.concat(P):[P])}),c.pop()}}if(!a.isObject(e))throw new TypeError("data must be an object");return A(e),t}var C=nr;function Je(e){let t={"!":"%21","'":"%27","(":"%28",")":"%29","~":"%7E","%20":"+","%00":"\0"};return encodeURIComponent(e).replace(/[!'()~]|%20|%00/g,function(n){return t[n]})}function Ve(e,t){this._pairs=[],e&&C(e,this,t)}var We=Ve.prototype;We.append=function(t,r){this._pairs.push([t,r])};We.toString=function(t){let r=t?function(n){return t.call(this,n,Je)}:Je;return this._pairs.map(function(s){return r(s[0])+"="+r(s[1])},"").join("&")};var Z=Ve;function sr(e){return encodeURIComponent(e).replace(/%3A/gi,":").replace(/%24/g,"$").replace(/%2C/gi,",").replace(/%20/g,"+").replace(/%5B/gi,"[").replace(/%5D/gi,"]")}function j(e,t,r){if(!t)return e;let n=r&&r.encode||sr,s=r&&r.serialize,i;if(s?i=s(t,r):i=a.isURLSearchParams(t)?t.toString():new Z(t,r).toString(n),i){let o=e.indexOf("#");o!==-1&&(e=e.slice(0,o)),e+=(e.indexOf("?")===-1?"?":"&")+i}return e}var fe=class{constructor(){this.handlers=[]}use(t,r,n){return this.handlers.push({fulfilled:t,rejected:r,synchronous:n?n.synchronous:!1,runWhen:n?n.runWhen:null}),this.handlers.length-1}eject(t){this.handlers[t]&&(this.handlers[t]=null)}clear(){this.handlers&&(this.handlers=[])}forEach(t){a.forEach(this.handlers,function(n){n!==null&&t(n)})}},de=fe;var Y={silentJSONParsing:!0,forcedJSONParsing:!0,clarifyTimeoutError:!1};var $e=typeof URLSearchParams!="undefined"?URLSearchParams:Z;var Ke=typeof FormData!="undefined"?FormData:null;var Ge=typeof Blob!="undefined"?Blob:null;var Xe={isBrowser:!0,classes:{URLSearchParams:$e,FormData:Ke,Blob:Ge},protocols:["http","https","file","blob","url","data"]};var me={};Ne(me,{hasBrowserEnv:()=>Qe,hasStandardBrowserEnv:()=>or,hasStandardBrowserWebWorkerEnv:()=>ir});var Qe=typeof window!="undefined"&&typeof document!="undefined",or=(e=>Qe&&["ReactNative","NativeScript","NS"].indexOf(e)<0)(typeof navigator!="undefined"&&navigator.product),ir=typeof WorkerGlobalScope!="undefined"&&self instanceof WorkerGlobalScope&&typeof self.importScripts=="function";var E={...me,...Xe};function pe(e,t){return C(e,new E.classes.URLSearchParams,Object.assign({visitor:function(r,n,s,i){return E.isNode&&a.isBuffer(r)?(this.append(n,r.toString("base64")),!1):i.defaultVisitor.apply(this,arguments)}},t))}function ar(e){return a.matchAll(/\w+|\[(\w*)]/g,e).map(t=>t[0]==="[]"?"":t[1]||t[0])}function ur(e){let t={},r=Object.keys(e),n,s=r.length,i;for(n=0;n<s;n++)i=r[n],t[i]=e[i];return t}function cr(e){function t(r,n,s,i){let o=r[i++],u=Number.isFinite(+o),m=i>=r.length;return o=!o&&a.isArray(s)?s.length:o,m?(a.hasOwnProp(s,o)?s[o]=[s[o],n]:s[o]=n,!u):((!s[o]||!a.isObject(s[o]))&&(s[o]=[]),t(r,n,s[o],i)&&a.isArray(s[o])&&(s[o]=ur(s[o])),!u)}if(a.isFormData(e)&&a.isFunction(e.entries)){let r={};return a.forEachEntry(e,(n,s)=>{t(ar(n),s,r,0)}),r}return null}var ee=cr;function lr(e,t,r){if(a.isString(e))try{return(t||JSON.parse)(e),a.trim(e)}catch(n){if(n.name!=="SyntaxError")throw n}return(r||JSON.stringify)(e)}var he={transitional:Y,adapter:["xhr","http"],transformRequest:[function(t,r){let n=r.getContentType()||"",s=n.indexOf("application/json")>-1,i=a.isObject(t);if(i&&a.isHTMLForm(t)&&(t=new FormData(t)),a.isFormData(t))return s&&s?JSON.stringify(ee(t)):t;if(a.isArrayBuffer(t)||a.isBuffer(t)||a.isStream(t)||a.isFile(t)||a.isBlob(t))return t;if(a.isArrayBufferView(t))return t.buffer;if(a.isURLSearchParams(t))return r.setContentType("application/x-www-form-urlencoded;charset=utf-8",!1),t.toString();let u;if(i){if(n.indexOf("application/x-www-form-urlencoded")>-1)return pe(t,this.formSerializer).toString();if((u=a.isFileList(t))||n.indexOf("multipart/form-data")>-1){let m=this.env&&this.env.FormData;return C(u?{"files[]":t}:t,m&&new m,this.formSerializer)}}return i||s?(r.setContentType("application/json",!1),lr(t)):t}],transformResponse:[function(t){let r=this.transitional||he.transitional,n=r&&r.forcedJSONParsing,s=this.responseType==="json";if(t&&a.isString(t)&&(n&&!this.responseType||s)){let o=!(r&&r.silentJSONParsing)&&s;try{return JSON.parse(t)}catch(u){if(o)throw u.name==="SyntaxError"?h.from(u,h.ERR_BAD_RESPONSE,this,null,this.response):u}}return t}],timeout:0,xsrfCookieName:"XSRF-TOKEN",xsrfHeaderName:"X-XSRF-TOKEN",maxContentLength:-1,maxBodyLength:-1,env:{FormData:E.classes.FormData,Blob:E.classes.Blob},validateStatus:function(t){return t>=200&&t<300},headers:{common:{Accept:"application/json, text/plain, */*","Content-Type":void 0}}};a.forEach(["delete","get","head","post","put","patch"],e=>{he.headers[e]={}});var D=he;var fr=a.toObjectSet(["age","authorization","content-length","content-type","etag","expires","from","host","if-modified-since","if-unmodified-since","last-modified","location","max-forwards","proxy-authorization","referer","retry-after","user-agent"]),Ze=e=>{let t={},r,n,s;return e&&e.split(`
`).forEach(function(o){s=o.indexOf(":"),r=o.substring(0,s).trim().toLowerCase(),n=o.substring(s+1).trim(),!(!r||t[r]&&fr[r])&&(r==="set-cookie"?t[r]?t[r].push(n):t[r]=[n]:t[r]=t[r]?t[r]+", "+n:n)}),t};var Ye=Symbol("internals");function M(e){return e&&String(e).trim().toLowerCase()}function te(e){return e===!1||e==null?e:a.isArray(e)?e.map(te):String(e)}function dr(e){let t=Object.create(null),r=/([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g,n;for(;n=r.exec(e);)t[n[1]]=n[2];return t}var mr=e=>/^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(e.trim());function ye(e,t,r,n,s){if(a.isFunction(n))return n.call(this,t,r);if(s&&(t=r),!!a.isString(t)){if(a.isString(n))return t.indexOf(n)!==-1;if(a.isRegExp(n))return n.test(t)}}function pr(e){return e.trim().toLowerCase().replace(/([a-z\d])(\w*)/g,(t,r,n)=>r.toUpperCase()+n)}function hr(e,t){let r=a.toCamelCase(" "+t);["get","set","has"].forEach(n=>{Object.defineProperty(e,n+r,{value:function(s,i,o){return this[n].call(this,t,s,i,o)},configurable:!0})})}var I=class{constructor(t){t&&this.set(t)}set(t,r,n){let s=this;function i(u,m,p){let l=M(m);if(!l)throw new Error("header name must be a non-empty string");let c=a.findKey(s,l);(!c||s[c]===void 0||p===!0||p===void 0&&s[c]!==!1)&&(s[c||m]=te(u))}let o=(u,m)=>a.forEach(u,(p,l)=>i(p,l,m));return a.isPlainObject(t)||t instanceof this.constructor?o(t,r):a.isString(t)&&(t=t.trim())&&!mr(t)?o(Ze(t),r):t!=null&&i(r,t,n),this}get(t,r){if(t=M(t),t){let n=a.findKey(this,t);if(n){let s=this[n];if(!r)return s;if(r===!0)return dr(s);if(a.isFunction(r))return r.call(this,s,n);if(a.isRegExp(r))return r.exec(s);throw new TypeError("parser must be boolean|regexp|function")}}}has(t,r){if(t=M(t),t){let n=a.findKey(this,t);return!!(n&&this[n]!==void 0&&(!r||ye(this,this[n],n,r)))}return!1}delete(t,r){let n=this,s=!1;function i(o){if(o=M(o),o){let u=a.findKey(n,o);u&&(!r||ye(n,n[u],u,r))&&(delete n[u],s=!0)}}return a.isArray(t)?t.forEach(i):i(t),s}clear(t){let r=Object.keys(this),n=r.length,s=!1;for(;n--;){let i=r[n];(!t||ye(this,this[i],i,t,!0))&&(delete this[i],s=!0)}return s}normalize(t){let r=this,n={};return a.forEach(this,(s,i)=>{let o=a.findKey(n,i);if(o){r[o]=te(s),delete r[i];return}let u=t?pr(i):String(i).trim();u!==i&&delete r[i],r[u]=te(s),n[u]=!0}),this}concat(...t){return this.constructor.concat(this,...t)}toJSON(t){let r=Object.create(null);return a.forEach(this,(n,s)=>{n!=null&&n!==!1&&(r[s]=t&&a.isArray(n)?n.join(", "):n)}),r}[Symbol.iterator](){return Object.entries(this.toJSON())[Symbol.iterator]()}toString(){return Object.entries(this.toJSON()).map(([t,r])=>t+": "+r).join(`
`)}get[Symbol.toStringTag](){return"AxiosHeaders"}static from(t){return t instanceof this?t:new this(t)}static concat(t,...r){let n=new this(t);return r.forEach(s=>n.set(s)),n}static accessor(t){let n=(this[Ye]=this[Ye]={accessors:{}}).accessors,s=this.prototype;function i(o){let u=M(o);n[u]||(hr(s,o),n[u]=!0)}return a.isArray(t)?t.forEach(i):i(t),this}};I.accessor(["Content-Type","Content-Length","Accept","Accept-Encoding","User-Agent","Authorization"]);a.reduceDescriptors(I.prototype,({value:e},t)=>{let r=t[0].toUpperCase()+t.slice(1);return{get:()=>e,set(n){this[r]=n}}});a.freezeMethods(I);var S=I;function v(e,t){let r=this||D,n=t||r,s=S.from(n.headers),i=n.data;return a.forEach(e,function(u){i=u.call(r,i,s.normalize(),t?t.status:void 0)}),s.normalize(),i}function z(e){return!!(e&&e.__CANCEL__)}function et(e,t,r){h.call(this,e==null?"canceled":e,h.ERR_CANCELED,t,r),this.name="CanceledError"}a.inherits(et,h,{__CANCEL__:!0});var N=et;function ge(e,t,r){let n=r.config.validateStatus;!r.status||!n||n(r.status)?e(r):t(new h("Request failed with status code "+r.status,[h.ERR_BAD_REQUEST,h.ERR_BAD_RESPONSE][Math.floor(r.status/100)-4],r.config,r.request,r))}var tt=E.hasStandardBrowserEnv?{write(e,t,r,n,s,i){let o=[e+"="+encodeURIComponent(t)];a.isNumber(r)&&o.push("expires="+new Date(r).toGMTString()),a.isString(n)&&o.push("path="+n),a.isString(s)&&o.push("domain="+s),i===!0&&o.push("secure"),document.cookie=o.join("; ")},read(e){let t=document.cookie.match(new RegExp("(^|;\\s*)("+e+")=([^;]*)"));return t?decodeURIComponent(t[3]):null},remove(e){this.write(e,"",Date.now()-864e5)}}:{write(){},read(){return null},remove(){}};function be(e){return/^([a-z][a-z\d+\-.]*:)?\/\//i.test(e)}function xe(e,t){return t?e.replace(/\/+$/,"")+"/"+t.replace(/^\/+/,""):e}function J(e,t){return e&&!be(t)?xe(e,t):t}var rt=E.hasStandardBrowserEnv?function(){let t=/(msie|trident)/i.test(navigator.userAgent),r=document.createElement("a"),n;function s(i){let o=i;return t&&(r.setAttribute("href",o),o=r.href),r.setAttribute("href",o),{href:r.href,protocol:r.protocol?r.protocol.replace(/:$/,""):"",host:r.host,search:r.search?r.search.replace(/^\?/,""):"",hash:r.hash?r.hash.replace(/^#/,""):"",hostname:r.hostname,port:r.port,pathname:r.pathname.charAt(0)==="/"?r.pathname:"/"+r.pathname}}return n=s(window.location.href),function(o){let u=a.isString(o)?s(o):o;return u.protocol===n.protocol&&u.host===n.host}}():function(){return function(){return!0}}();function we(e){let t=/^([-+\w]{1,25})(:?\/\/|:)/.exec(e);return t&&t[1]||""}function yr(e,t){e=e||10;let r=new Array(e),n=new Array(e),s=0,i=0,o;return t=t!==void 0?t:1e3,function(m){let p=Date.now(),l=n[i];o||(o=p),r[s]=m,n[s]=p;let c=i,b=0;for(;c!==s;)b+=r[c++],c=c%e;if(s=(s+1)%e,s===i&&(i=(i+1)%e),p-o<t)return;let A=l&&p-l;return A?Math.round(b*1e3/A):void 0}}var nt=yr;function st(e,t){let r=0,n=nt(50,250);return s=>{let i=s.loaded,o=s.lengthComputable?s.total:void 0,u=i-r,m=n(u),p=i<=o;r=i;let l={loaded:i,total:o,progress:o?i/o:void 0,bytes:u,rate:m||void 0,estimated:m&&o&&p?(o-i)/m:void 0,event:s};l[t?"download":"upload"]=!0,e(l)}}var gr=typeof XMLHttpRequest!="undefined",ot=gr&&function(e){return new Promise(function(r,n){let s=e.data,i=S.from(e.headers).normalize(),{responseType:o,withXSRFToken:u}=e,m;function p(){e.cancelToken&&e.cancelToken.unsubscribe(m),e.signal&&e.signal.removeEventListener("abort",m)}let l;if(a.isFormData(s)){if(E.hasStandardBrowserEnv||E.hasStandardBrowserWebWorkerEnv)i.setContentType(!1);else if((l=i.getContentType())!==!1){let[d,...x]=l?l.split(";").map(w=>w.trim()).filter(Boolean):[];i.setContentType([d||"multipart/form-data",...x].join("; "))}}let c=new XMLHttpRequest;if(e.auth){let d=e.auth.username||"",x=e.auth.password?unescape(encodeURIComponent(e.auth.password)):"";i.set("Authorization","Basic "+btoa(d+":"+x))}let b=J(e.baseURL,e.url);c.open(e.method.toUpperCase(),j(b,e.params,e.paramsSerializer),!0),c.timeout=e.timeout;function A(){if(!c)return;let d=S.from("getAllResponseHeaders"in c&&c.getAllResponseHeaders()),w={data:!o||o==="text"||o==="json"?c.responseText:c.response,status:c.status,statusText:c.statusText,headers:d,config:e,request:c};ge(function(_){r(_),p()},function(_){n(_),p()},w),c=null}if("onloadend"in c?c.onloadend=A:c.onreadystatechange=function(){!c||c.readyState!==4||c.status===0&&!(c.responseURL&&c.responseURL.indexOf("file:")===0)||setTimeout(A)},c.onabort=function(){c&&(n(new h("Request aborted",h.ECONNABORTED,e,c)),c=null)},c.onerror=function(){n(new h("Network Error",h.ERR_NETWORK,e,c)),c=null},c.ontimeout=function(){let x=e.timeout?"timeout of "+e.timeout+"ms exceeded":"timeout exceeded",w=e.transitional||Y;e.timeoutErrorMessage&&(x=e.timeoutErrorMessage),n(new h(x,w.clarifyTimeoutError?h.ETIMEDOUT:h.ECONNABORTED,e,c)),c=null},E.hasStandardBrowserEnv&&(u&&a.isFunction(u)&&(u=u(e)),u||u!==!1&&rt(b))){let d=e.xsrfHeaderName&&e.xsrfCookieName&&tt.read(e.xsrfCookieName);d&&i.set(e.xsrfHeaderName,d)}s===void 0&&i.setContentType(null),"setRequestHeader"in c&&a.forEach(i.toJSON(),function(x,w){c.setRequestHeader(w,x)}),a.isUndefined(e.withCredentials)||(c.withCredentials=!!e.withCredentials),o&&o!=="json"&&(c.responseType=e.responseType),typeof e.onDownloadProgress=="function"&&c.addEventListener("progress",st(e.onDownloadProgress,!0)),typeof e.onUploadProgress=="function"&&c.upload&&c.upload.addEventListener("progress",st(e.onUploadProgress)),(e.cancelToken||e.signal)&&(m=d=>{c&&(n(!d||d.type?new N(null,e,c):d),c.abort(),c=null)},e.cancelToken&&e.cancelToken.subscribe(m),e.signal&&(e.signal.aborted?m():e.signal.addEventListener("abort",m)));let f=we(b);if(f&&E.protocols.indexOf(f)===-1){n(new h("Unsupported protocol "+f+":",h.ERR_BAD_REQUEST,e));return}c.send(s||null)})};var Ee={http:Q,xhr:ot};a.forEach(Ee,(e,t)=>{if(e){try{Object.defineProperty(e,"name",{value:t})}catch(r){}Object.defineProperty(e,"adapterName",{value:t})}});var it=e=>`- ${e}`,br=e=>a.isFunction(e)||e===null||e===!1,re={getAdapter:e=>{e=a.isArray(e)?e:[e];let{length:t}=e,r,n,s={};for(let i=0;i<t;i++){r=e[i];let o;if(n=r,!br(r)&&(n=Ee[(o=String(r)).toLowerCase()],n===void 0))throw new h(`Unknown adapter '${o}'`);if(n)break;s[o||"#"+i]=n}if(!n){let i=Object.entries(s).map(([u,m])=>`adapter ${u} `+(m===!1?"is not supported by the environment":"is not available in the build")),o=t?i.length>1?`since :
`+i.map(it).join(`
`):" "+it(i[0]):"as no adapter specified";throw new h("There is no suitable adapter to dispatch the request "+o,"ERR_NOT_SUPPORT")}return n},adapters:Ee};function Se(e){if(e.cancelToken&&e.cancelToken.throwIfRequested(),e.signal&&e.signal.aborted)throw new N(null,e)}function ne(e){return Se(e),e.headers=S.from(e.headers),e.data=v.call(e,e.transformRequest),["post","put","patch"].indexOf(e.method)!==-1&&e.headers.setContentType("application/x-www-form-urlencoded",!1),re.getAdapter(e.adapter||D.adapter)(e).then(function(n){return Se(e),n.data=v.call(e,e.transformResponse,n),n.headers=S.from(n.headers),n},function(n){return z(n)||(Se(e),n&&n.response&&(n.response.data=v.call(e,e.transformResponse,n.response),n.response.headers=S.from(n.response.headers))),Promise.reject(n)})}var at=e=>e instanceof S?e.toJSON():e;function O(e,t){t=t||{};let r={};function n(p,l,c){return a.isPlainObject(p)&&a.isPlainObject(l)?a.merge.call({caseless:c},p,l):a.isPlainObject(l)?a.merge({},l):a.isArray(l)?l.slice():l}function s(p,l,c){if(a.isUndefined(l)){if(!a.isUndefined(p))return n(void 0,p,c)}else return n(p,l,c)}function i(p,l){if(!a.isUndefined(l))return n(void 0,l)}function o(p,l){if(a.isUndefined(l)){if(!a.isUndefined(p))return n(void 0,p)}else return n(void 0,l)}function u(p,l,c){if(c in t)return n(p,l);if(c in e)return n(void 0,p)}let m={url:i,method:i,data:i,baseURL:o,transformRequest:o,transformResponse:o,paramsSerializer:o,timeout:o,timeoutMessage:o,withCredentials:o,withXSRFToken:o,adapter:o,responseType:o,xsrfCookieName:o,xsrfHeaderName:o,onUploadProgress:o,onDownloadProgress:o,decompress:o,maxContentLength:o,maxBodyLength:o,beforeRedirect:o,transport:o,httpAgent:o,httpsAgent:o,cancelToken:o,socketPath:o,responseEncoding:o,validateStatus:u,headers:(p,l)=>s(at(p),at(l),!0)};return a.forEach(Object.keys(Object.assign({},e,t)),function(l){let c=m[l]||s,b=c(e[l],t[l],l);a.isUndefined(b)&&c!==u||(r[l]=b)}),r}var se="1.6.2";var Ae={};["object","boolean","number","function","string","symbol"].forEach((e,t)=>{Ae[e]=function(n){return typeof n===e||"a"+(t<1?"n ":" ")+e}});var ut={};Ae.transitional=function(t,r,n){function s(i,o){return"[Axios v"+se+"] Transitional option '"+i+"'"+o+(n?". "+n:"")}return(i,o,u)=>{if(t===!1)throw new h(s(o," has been removed"+(r?" in "+r:"")),h.ERR_DEPRECATED);return r&&!ut[o]&&(ut[o]=!0,console.warn(s(o," has been deprecated since v"+r+" and will be removed in the near future"))),t?t(i,o,u):!0}};function xr(e,t,r){if(typeof e!="object")throw new h("options must be an object",h.ERR_BAD_OPTION_VALUE);let n=Object.keys(e),s=n.length;for(;s-- >0;){let i=n[s],o=t[i];if(o){let u=e[i],m=u===void 0||o(u,i,e);if(m!==!0)throw new h("option "+i+" must be "+m,h.ERR_BAD_OPTION_VALUE);continue}if(r!==!0)throw new h("Unknown option "+i,h.ERR_BAD_OPTION)}}var oe={assertOptions:xr,validators:Ae};var F=oe.validators,L=class{constructor(t){this.defaults=t,this.interceptors={request:new de,response:new de}}request(t,r){typeof t=="string"?(r=r||{},r.url=t):r=t||{},r=O(this.defaults,r);let{transitional:n,paramsSerializer:s,headers:i}=r;n!==void 0&&oe.assertOptions(n,{silentJSONParsing:F.transitional(F.boolean),forcedJSONParsing:F.transitional(F.boolean),clarifyTimeoutError:F.transitional(F.boolean)},!1),s!=null&&(a.isFunction(s)?r.paramsSerializer={serialize:s}:oe.assertOptions(s,{encode:F.function,serialize:F.function},!0)),r.method=(r.method||this.defaults.method||"get").toLowerCase();let o=i&&a.merge(i.common,i[r.method]);i&&a.forEach(["delete","get","head","post","put","patch","common"],f=>{delete i[f]}),r.headers=S.concat(o,i);let u=[],m=!0;this.interceptors.request.forEach(function(d){typeof d.runWhen=="function"&&d.runWhen(r)===!1||(m=m&&d.synchronous,u.unshift(d.fulfilled,d.rejected))});let p=[];this.interceptors.response.forEach(function(d){p.push(d.fulfilled,d.rejected)});let l,c=0,b;if(!m){let f=[ne.bind(this),void 0];for(f.unshift.apply(f,u),f.push.apply(f,p),b=f.length,l=Promise.resolve(r);c<b;)l=l.then(f[c++],f[c++]);return l}b=u.length;let A=r;for(c=0;c<b;){let f=u[c++],d=u[c++];try{A=f(A)}catch(x){d.call(this,x);break}}try{l=ne.call(this,A)}catch(f){return Promise.reject(f)}for(c=0,b=p.length;c<b;)l=l.then(p[c++],p[c++]);return l}getUri(t){t=O(this.defaults,t);let r=J(t.baseURL,t.url);return j(r,t.params,t.paramsSerializer)}};a.forEach(["delete","get","head","options"],function(t){L.prototype[t]=function(r,n){return this.request(O(n||{},{method:t,url:r,data:(n||{}).data}))}});a.forEach(["post","put","patch"],function(t){function r(n){return function(i,o,u){return this.request(O(u||{},{method:t,headers:n?{"Content-Type":"multipart/form-data"}:{},url:i,data:o}))}}L.prototype[t]=r(),L.prototype[t+"Form"]=r(!0)});var V=L;var Re=class e{constructor(t){if(typeof t!="function")throw new TypeError("executor must be a function.");let r;this.promise=new Promise(function(i){r=i});let n=this;this.promise.then(s=>{if(!n._listeners)return;let i=n._listeners.length;for(;i-- >0;)n._listeners[i](s);n._listeners=null}),this.promise.then=s=>{let i,o=new Promise(u=>{n.subscribe(u),i=u}).then(s);return o.cancel=function(){n.unsubscribe(i)},o},t(function(i,o,u){n.reason||(n.reason=new N(i,o,u),r(n.reason))})}throwIfRequested(){if(this.reason)throw this.reason}subscribe(t){if(this.reason){t(this.reason);return}this._listeners?this._listeners.push(t):this._listeners=[t]}unsubscribe(t){if(!this._listeners)return;let r=this._listeners.indexOf(t);r!==-1&&this._listeners.splice(r,1)}static source(){let t;return{token:new e(function(s){t=s}),cancel:t}}},ct=Re;function Te(e){return function(r){return e.apply(null,r)}}function Oe(e){return a.isObject(e)&&e.isAxiosError===!0}var Pe={Continue:100,SwitchingProtocols:101,Processing:102,EarlyHints:103,Ok:200,Created:201,Accepted:202,NonAuthoritativeInformation:203,NoContent:204,ResetContent:205,PartialContent:206,MultiStatus:207,AlreadyReported:208,ImUsed:226,MultipleChoices:300,MovedPermanently:301,Found:302,SeeOther:303,NotModified:304,UseProxy:305,Unused:306,TemporaryRedirect:307,PermanentRedirect:308,BadRequest:400,Unauthorized:401,PaymentRequired:402,Forbidden:403,NotFound:404,MethodNotAllowed:405,NotAcceptable:406,ProxyAuthenticationRequired:407,RequestTimeout:408,Conflict:409,Gone:410,LengthRequired:411,PreconditionFailed:412,PayloadTooLarge:413,UriTooLong:414,UnsupportedMediaType:415,RangeNotSatisfiable:416,ExpectationFailed:417,ImATeapot:418,MisdirectedRequest:421,UnprocessableEntity:422,Locked:423,FailedDependency:424,TooEarly:425,UpgradeRequired:426,PreconditionRequired:428,TooManyRequests:429,RequestHeaderFieldsTooLarge:431,UnavailableForLegalReasons:451,InternalServerError:500,NotImplemented:501,BadGateway:502,ServiceUnavailable:503,GatewayTimeout:504,HttpVersionNotSupported:505,VariantAlsoNegotiates:506,InsufficientStorage:507,LoopDetected:508,NotExtended:510,NetworkAuthenticationRequired:511};Object.entries(Pe).forEach(([e,t])=>{Pe[t]=e});var lt=Pe;function ft(e){let t=new V(e),r=q(V.prototype.request,t);return a.extend(r,V.prototype,t,{allOwnKeys:!0}),a.extend(r,t,null,{allOwnKeys:!0}),r.create=function(s){return ft(O(e,s))},r}var g=ft(D);g.Axios=V;g.CanceledError=N;g.CancelToken=ct;g.isCancel=z;g.VERSION=se;g.toFormData=C;g.AxiosError=h;g.Cancel=g.CanceledError;g.all=function(t){return Promise.all(t)};g.spread=Te;g.isAxiosError=Oe;g.mergeConfig=O;g.AxiosHeaders=S;g.formToJSON=e=>ee(a.isHTMLForm(e)?new FormData(e):e);g.getAdapter=re.getAdapter;g.HttpStatusCode=lt;g.default=g;var W=g;var{Axios:Zs,AxiosError:Ys,CanceledError:eo,isCancel:to,CancelToken:ro,VERSION:no,all:so,Cancel:oo,isAxiosError:io,spread:ao,toFormData:uo,AxiosHeaders:co,HttpStatusCode:lo,formToJSON:fo,getAdapter:mo,mergeConfig:po}=W;var dt=e=>{let t=new Array;for(let r=0;r<e.length;r++)t.push(Array.from(e[r]));return t},mt=e=>{if(e.length>64&&e.slice(0,2)==="0x"&&(e=e.slice(2)),e.length!=64)throw new Error("address length must be 64 or it's size must be 256 bits");return e},pt=e=>new Promise(t=>{setTimeout(t,e)});var _e=(s=>(s.Success="Success",s.Failed="Fail",s.Pending="Unexecuted",s.Invalid="Invalid",s))(_e||{});var Ce=class e{constructor(t,r=3){this.requestTimeout=1e4;this.maxRetryForTransactionCompletion=60;this.delayBetweenPoolingRequest=1e3;this.supraNodeURL=t,this.chainId=new y.TxnBuilderTypes.ChainId(r)}static async init(t){let r=new e(t);return r.chainId=await r.getChainId(),r}async sendRequest(t,r,n){let s;if(t==!0)s=await W({method:"get",baseURL:this.supraNodeURL,url:r,timeout:this.requestTimeout});else{if(n==null)throw new Error("For Post Request 'data' Should Not Be 'undefined'");s=await W({method:"post",baseURL:this.supraNodeURL,url:r,data:n,headers:{"Content-Type":"application/json"},timeout:this.requestTimeout})}if(s.status==404)throw new Error("Invalid URL, Path Not Found");return s}async getChainId(){return new y.TxnBuilderTypes.ChainId(Number((await this.sendRequest(!0,"/rpc/v1/transactions/chain_id")).data))}async getGasPrice(){return BigInt((await this.sendRequest(!0,"/rpc/v1/transactions/estimate_gas_price")).data.mean_gas_price)}async fundAccountWithFaucet(t){let r=await this.sendRequest(!0,`/rpc/v1/wallet/faucet/${t.toString()}`);return await this.waitForTransactionCompletion(r.data.transactions[r.data.transactions.length-1]),r.data.transactions}async isAccountExists(t){return(await this.sendRequest(!0,`/rpc/v1/accounts/${t.toString()}`)).data!=null}async getAccountInfo(t){let r=await this.sendRequest(!0,`/rpc/v1/accounts/${t.toString()}`);if(r.data==null)throw new Error("Account Not Exists, Or Invalid Account Is Passed");return{sequence_number:BigInt(r.data.sequence_number),authentication_key:r.data.authentication_key}}async getAccountResources(t){return(await this.sendRequest(!0,`/rpc/v1/accounts/${t.toString()}/resources`)).data.resources}async getResourceData(t,r){let n=await this.sendRequest(!0,`/rpc/v1/accounts/${t.toString()}/resources/${r}`);if(n.data.result[0]==null)throw new Error("Resource not found");return n.data.result[0]}async getTransactionDetail(t){var n;let r=await this.sendRequest(!0,`/rpc/v1/transactions/${t}`);if(r.data.transaction==null)throw new Error("Transaction Not Found, May Be Transaction Hash Is Invalid");return{txHash:t,sender:r.data.sender,receiver:r.data.receiver,amount:r.data.amount,sequenceNumber:r.data.sequence_number,maxGasAmount:r.data.max_gas_amount,gasUnitPrice:r.data.gas_unit_price,gasUsed:r.data.gas_used,transactionCost:r.data.gas_unit_price*r.data.gas_used,txConfirmationTime:(n=r.data.confirmation_time)==null?void 0:n.timestamp,status:r.data.status=="Unexecuted"?"Pending":r.data.status=="Fail"?"Failed":r.data.status,action:r.data.action,events:r.data.events,blockNumber:r.data.block_number,blockHash:r.data.block_hash}}async getSupraTransferHistory(t,r=15,n="0000000000000000000000000000000000000000000000000000000000000000"){let s=await this.sendRequest(!0,`/rpc/v1/accounts/${t.toString()}/transactions?count=${r}&last_seen=${n}`);if(s.data.record==null)throw new Error("Account Not Exists, Or Invalid Account Is Passed");let i=[];return s.data.record.forEach(o=>{var u;i.push({txHash:o.txn_hash,sender:o.sender,receiver:o.receiver,amount:o.amount,sequenceNumber:o.sequence_number,maxGasAmount:o.max_gas_amount,gasUnitPrice:o.gas_unit_price,gasUsed:o.gas_used,transactionCost:o.gas_unit_price*o.gas_used,txConfirmationTime:(u=o.confirmation_time)==null?void 0:u.timestamp,status:o.status=="Unexecuted"?"Pending":o.status=="Fail"?"Failed":o.status,action:o.action,events:o.events,blockNumber:o.block_number,blockHash:o.block_hash})}),i}async getAccountSupraCoinBalance(t){return BigInt((await this.getResourceData(t,"0x1::coin::CoinStore<0x1::supra_coin::SupraCoin>")).coin.value)}async waitForTransactionCompletion(t){for(let r=0;r<this.maxRetryForTransactionCompletion;r++){let n=(await this.getTransactionDetail(t)).status;if(n!="Unexecuted")return n;await pt(this.delayBetweenPoolingRequest)}return"Unexecuted"}async sendTx(t){let r=await this.sendRequest(!1,"/rpc/v1/transactions/submit",t);return console.log("Transaction Request Sent, Waiting For Completion"),{txHash:r.data.txn_hash,result:await this.waitForTransactionCompletion(r.data.txn_hash)}}async getSendTxPayload(t,r){console.log("Sequence Number: ",r.sequence_number);let n=r.payload.value;return{Move:{raw_txn:{sender:t.address().toString(),sequence_number:Number(r.sequence_number),payload:{EntryFunction:{module:{address:n.module_name.address.toHexString().toString(),name:n.module_name.name.value},function:n.function_name.value,ty_args:[],args:dt(n.args)}},max_gas_amount:Number(r.max_gas_amount),gas_unit_price:Number(r.gas_unit_price),expiration_timestamp_secs:Number(r.expiration_timestamp_secs),chain_id:r.chain_id.value},authenticator:{Ed25519:{public_key:t.pubKey().toString(),signature:t.signBuffer(y.TransactionBuilder.getSigningMessage(r)).toString()}}}}}async getTxObject(t,r,n,s,i,o,u=BigInt(2e3)){return new y.TxnBuilderTypes.RawTransaction(new y.TxnBuilderTypes.AccountAddress(t.toUint8Array()),(await this.getAccountInfo(t)).sequence_number,new y.TxnBuilderTypes.TransactionPayloadEntryFunction(new y.TxnBuilderTypes.EntryFunction(new y.TxnBuilderTypes.ModuleId(new y.TxnBuilderTypes.AccountAddress(new y.HexString(mt(r)).toUint8Array()),new y.TxnBuilderTypes.Identifier(n)),new y.TxnBuilderTypes.Identifier(s),i,o)),u,BigInt(100),BigInt(999999999999999),this.chainId)}async transferSupraCoin(t,r,n){let s=BigInt(10);if(await this.isAccountExists(r)==!1&&(s=BigInt(1020)),n+s*BigInt(100)>await this.getAccountSupraCoinBalance(t.address()))throw new Error("Insufficient Supra Coins");let i=await this.getSendTxPayload(t,await this.getTxObject(t.address(),"0000000000000000000000000000000000000000000000000000000000000001","aptos_account","transfer",[],[r.toUint8Array(),y.BCS.bcsSerializeUint64(n)],s));return await this.simulateTx(i),await this.sendTx(i)}async publishPackage(t,r,n){let s=new y.BCS.Serializer,i=[];for(let u=0;u<n.length;u++)i.push(new y.TxnBuilderTypes.Module(Uint8Array.from(n[u])));y.BCS.serializeVector(i,s);let o=await this.getSendTxPayload(t,await this.getTxObject(t.address(),"0000000000000000000000000000000000000000000000000000000000000001","code","publish_package_txn",[],[y.BCS.bcsSerializeBytes(r),s.getBytes()]));return await this.simulateTx(o),await this.sendTx(o)}async simulateTx(t){let r=await this.sendRequest(!1,"/rpc/v1/transactions/simulate",t);if(r.data.estimated_status.split(" ")[1]!=="EXECUTED")throw new Error("Transaction Can Be Failed, Reason: "+r.data.estimated_status);console.log("Transaction Simulation Done")}};
//# sourceMappingURL=index.js.map
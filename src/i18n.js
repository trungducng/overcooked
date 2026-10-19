// UI-only localization: game IDs, save data and network payloads stay language-neutral.
export const LANGUAGES={vi:'Tiếng Việt',en:'English',ja:'日本語',ko:'한국어'};
let language='vi';try{language=localStorage.getItem('kr-language')||'vi'}catch{}if(!LANGUAGES[language])language='vi';
const catalog=new Map();
export function addTranslations(rows){for(const row of rows.trim().split('\n')){const [vi,en,ja,ko]=row.split('|');if(!ko)continue;catalog.set(vi,{vi,en,ja,ko});catalog.set(vi.toUpperCase(),{vi:vi.toUpperCase(),en:en.toUpperCase(),ja,ko});catalog.set(vi.toLowerCase(),{vi:vi.toLowerCase(),en:en.toLowerCase(),ja,ko});}sorted=[...catalog.keys()].sort((a,b)=>b.length-a.length);pattern=new RegExp('(?<![\\p{L}])(?:'+sorted.map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?![\\p{L}])','gu');}
let sorted=[],pattern;
export const getLanguage=()=>language;
export const localize=(vi,en,ja,ko)=>({vi,en,ja,ko})[language]||vi;
export function translate(text,lang=language){if(lang==='vi'||!pattern)return text;return text.replace(pattern,key=>catalog.get(key)[lang]);}
export function setLanguage(value){if(!LANGUAGES[value])return;language=value;try{localStorage.setItem('kr-language',value)}catch{}document.documentElement.lang=value;document.title=localize('Kitchen Rush — Vào bếp thôi!','Kitchen Rush — Let’s cook!','Kitchen Rush — 料理を始めよう！','Kitchen Rush — 요리 시작!');document.dispatchEvent(new CustomEvent('languagechange'));}
export function mountLanguages(){
 const select=document.createElement('select');select.id='language';select.className='language-select';select.setAttribute('aria-label','Language / Ngôn ngữ / 言語 / 언어');select.dataset.noTranslate='true';select.innerHTML=Object.entries(LANGUAGES).map(([id,label])=>`<option value="${id}">${label}</option>`).join('');select.value=language;select.onchange=()=>setLanguage(select.value);document.querySelector('.header-actions').prepend(select);
 const originals=new WeakMap(),attributes=new WeakMap();
 const excluded=node=>node.parentElement?.closest('script,style,[data-no-translate]');
 function textNode(node){if(excluded(node))return;const current=node.nodeValue,old=originals.get(node),source=old&&old.translated===current?old.source:current;const translated=translate(source);originals.set(node,{source,translated});if(current!==translated)node.nodeValue=translated;}
 function element(el){if(el.closest('[data-no-translate]'))return;const old=attributes.get(el)||{};for(const attr of ['title','aria-label','placeholder']){const current=el.getAttribute(attr);if(current===null)continue;const source=old[attr]?.translated===current?old[attr].source:current,translated=translate(source);old[attr]={source,translated};if(current!==translated)el.setAttribute(attr,translated);}attributes.set(el,old);}
 function walk(root){if(root.nodeType===3){textNode(root);return}if(root.nodeType!==1||root.closest('script,style,[data-no-translate]'))return;element(root);const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);while(walker.nextNode()){const node=walker.currentNode;if(node.nodeType===3)textNode(node);else element(node);}}
 const options={subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder']};
 const observer=new MutationObserver(records=>{observer.disconnect();for(const record of records){if(record.type==='childList')record.addedNodes.forEach(walk);else if(record.type==='characterData')textNode(record.target);else element(record.target);}observer.observe(document.body,options);});
 const refresh=()=>{observer.disconnect();walk(document.body);select.value=language;observer.observe(document.body,options);};document.addEventListener('languagechange',refresh);setLanguage(language);return{refresh};
}

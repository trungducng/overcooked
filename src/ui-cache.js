// Cache source strings rather than rendered strings: i18n may replace the DOM text.
const texts=new WeakMap(),htmls=new WeakMap();
export function setText(el,value){if(!el)return;const next=String(value);if(texts.get(el)===next)return;texts.set(el,next);el.textContent=next;}
export function setHtml(el,value){if(!el)return;if(htmls.get(el)===value)return;htmls.set(el,value);el.innerHTML=value;}

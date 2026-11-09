const DX=(()=>{
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mean=a=>a.reduce((x,y)=>x+y,0)/(a.length||1),
cv=a=>{const m=mean(a);return m?Math.sqrt(mean(a.map(x=>(x-m)**2)))/m:0},
sg=(x,c,s)=>1/(1+Math.exp(-(x-c)/s)),
wc=t=>(t.match(/[\p{L}\p{N}]+/gu)||[]).length,
cnt=(t,p)=>{let c=0,i=-1;while((i=t.indexOf(p,i+1))>-1)c++;return c},
esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const CL=["delve","moreover","furthermore","in conclusion","it is important to note","it is worth noting","crucial role","tapestry","in today’s","in today's","leverage","a testament to","ever-evolving","landscape","holistic","seamless","pivotal","in summary","on the other hand","underscores","multifaceted","realm of","таким образом","в заключение","стоит отметить","важно отметить","необходимо отметить","ключевую роль","важную роль","в современном мире","в наше время","кроме того","более того","следует подчеркнуть","с одной стороны","с другой стороны","широкий спектр","комплексный подход","подводя итог","в эпоху","сонымен қатар","қорытындылай келе","қорытынды ретінде","атап өту маңызды","атап өткен жөн","маңызды рөл","қазіргі әлемде","қазіргі заманда","жалпы алғанда","айта кету керек","бұдан басқа","кешенді тәсіл","кең ауқымды","ерекше мәнге ие"];
const CC=["initialize","helper function","example usage","handle edge case","main function","return the","check if","create a new","validate input","error handling","process the","iterate over","loop through","calculate the","retrieve the","ensure that","инициализ","проверяем","возвращаем"];
const FP=["i","i’m","i'm","my","me","we","я","мой","моя","мне","меня","ну","типа","короче","блин","lol","btw","мен","менің","маған","мені","біз"];
const PRIOR={"Вариативность длины предложений":2,"Типовая длина предложений":.9,"Равномерность запятых":.65,"Повтор оборотов":.8,"Однотипные начала":.8,"Шаблонные ИИ-обороты":2.2,"Разметка и оформление":1.3,"Личный тон":.65,"Равномерность абзацев":.65,"Лексическое разнообразие":0,"Длина слов":0,"Конкретика (имена, числа)":0,"Начало с маленькой буквы":0,"Короткие фразы":0,
"Плотность комментариев":2,"Формальные комментарии":2,"Шаблонные комментарии":3,"Документация функций":1.5,"Единый стиль имён":1.2,"Длинные описательные имена":.8,"Однобуквенные имена":.8,"Небрежность форматирования":.8,"Отладка и TODO":1,"Равномерность блоков":.8,"Типы и обработка ошибок":.8,"Вариативность длины строк":0};
const B0={text:.7,code:0};
let M={b:{...B0},w:{...PRIOR},meta:{n:0}};

const CODE_EXT=/\.(py|js|mjs|ts|jsx|tsx|java|c|cc|cpp|h|hpp|cs|go|rs|php|rb|swift|kt|sql|sh|bat|ps1|css|scss|lua|dart|r|vue|svelte|html|xml|json|ya?ml|toml|ini)$/i;
function isCode(t,name){if(name&&/\.(md|txt|docx|pptx|xlsx|pdf|rtf|odt|epub|csv)$/i.test(name))return false;if(name&&CODE_EXT.test(name))return true;
 const L=t.split("\n");if(L.length<5)return false;return L.filter(l=>/[{};]\s*$|^\s*(def|class|function|import|from|const|let|var|return|if|for|while|public|private|#include)\b|=>|\)\s*\{/.test(l)).length/L.length>.3}

function textF(text,seg){
 const low=text.toLowerCase(),W=low.match(/[\p{L}\p{N}][\p{L}\p{N}’'-]*/gu)||[],n=W.length,
 S=text.split(/(?<=[.!?…])\s+|\n+/).map(s=>s.trim()).filter(s=>/\p{L}/u.test(s)),sl=S.map(wc).filter(x=>x>0),F=[],
 add=(k,a,v,h)=>F.push({k,a:cl(a),v:String(v),h}),
 lat=(low.match(/[a-z]/g)||[]).length,cy=(low.match(/[а-яёәіңғүұқөһ]/g)||[]).length;
 if(sl.length>=4){const c=cv(sl);add("Вариативность длины предложений",(.75-c)/.4,"CV "+c.toFixed(2),"насколько сильно меняется длина предложений");
  const sh=sl.filter(x=>x>=12&&x<=26).length/sl.length;add("Типовая длина предложений",(sh-.4)/.4,Math.round(sh*100)+"%","доля «удобных» предложений в 12–26 слов");
  const st=sl.filter(x=>x<5).length/sl.length;add("Короткие фразы",1-sg(st,.1,.08),Math.round(st*100)+"%","доля совсем коротких предложений");
  if(S.length>=6){const c2=cv(S.map(s=>(s.match(/[,;，]/g)||[]).length));add("Равномерность запятых",(.8-c2)/.5,"CV "+c2.toFixed(2),"насколько ровно расставлены запятые")}}
 if(n>=60){const m={};let tot=0;for(let i=0;i<n-2;i++){const k=W[i]+" "+W[i+1]+" "+W[i+2];m[k]=(m[k]||0)+1;tot++}const rep=(tot-Object.keys(m).length)/tot;add("Повтор оборотов",rep/.05,(rep*100).toFixed(1)+"%","повторяющиеся трёхсловные конструкции");
  const w3=W.slice(0,300),tt=new Set(w3).size/w3.length;add("Лексическое разнообразие",sg(tt,.62,.07),tt.toFixed(2),"доля уникальных слов")}
 if(S.length>=6){const f={};S.forEach(s=>{const w=(s.toLowerCase().match(/\p{L}+/u)||[""])[0];f[w]=(f[w]||0)+1});const mx=Math.max(...Object.values(f))/S.length;add("Однотипные начала",(mx-.1)/.2,Math.round(mx*100)+"%","предложения, начинающиеся одним и тем же словом");
  const lo=S.filter(s=>/^\p{Ll}/u.test(s)).length/S.length;add("Начало с маленькой буквы",1-lo*5,Math.round(lo*100)+"%","небрежность, характерная для людей")}
 const found=[];let cc=0;CL.forEach(p=>{const k=cnt(low,p);if(k){cc+=k;found.push([p,k])}});found.sort((a,b)=>b[1]-a[1]);
 if(n>=30){const d=cc/n*100,wl=mean(W.map(w=>w.length));add("Шаблонные ИИ-обороты",d,d.toFixed(2)+" на 100 слов","типичные клише и переходы");add("Длина слов",sg(wl,5.5,1),wl.toFixed(1),"средняя длина слова");
  const cp=(text.match(/(?<=[^.!?…\n]\s)\p{Lu}\p{L}+/gu)||[]).length+W.filter(w=>/\d/.test(w)).length;add("Конкретика (имена, числа)",1-sg(cp/n,.06,.04),Math.round(cp/n*100)+"%","имена собственные и числа")}
 const bl=text.split("\n").filter(l=>/^\s*([-*•]|\d+[.)]|#{1,4})\s/.test(l)).length,bo=(text.match(/\*\*[^*]+\*\*/g)||[]).length,dh=lat>cy?(text.match(/—/g)||[]).length/Math.max(n,1)*100:0,sc=bo*1.5+bl*.6+dh*1.5;
 add("Разметка и оформление",sc?.55+sc/4:.42,sc?"маркеры "+(bo+bl)+(dh?", тире "+dh.toFixed(1):""):"нет","списки, жирный шрифт, длинные тире — стиль чат-ботов");
 if(n>=40){const ex=(text.match(/[!?]/g)||[]).length,el=(text.match(/\.\.\.|…/g)||[]).length,pa=(text.match(/\(/g)||[]).length,em=(text.match(/\p{Extended_Pictographic}/gu)||[]).length,fp=W.filter(w=>FP.includes(w)).length,s=(ex+el+pa+em+fp*.5)/Math.max(S.length,1);add("Личный тон",1-cl(s/.35)*.9,s.toFixed(2),"восклицания, личные местоимения, разговорные вставки")}
 const P=text.split(/\n\s*\n/).filter(p=>p.trim());if(!seg&&P.length>=4){const c=cv(P.map(wc));add("Равномерность абзацев",(.5-c)/.35,"CV "+c.toFixed(2),"насколько одинаковы абзацы")}
 return{F,n,ns:S.length,found}}

function codeF(text,seg){
 const L=text.split("\n"),ne=L.filter(l=>l.trim()),n=ne.length||1,low=text.toLowerCase(),F=[],add=(k,a,v,h)=>F.push({k,a:cl(a),v:String(v),h}),
 cm=ne.filter(l=>/^\s*(\/\/|#(?!include|define|!)|--|\/\*|\*|""")/.test(l)),
 ct=cm.map(l=>l.replace(/^\s*(\/\/+|#+|--|\/\*+|\*+|""")\s*/,"").trim()).filter(Boolean);
 add("Плотность комментариев",sg(cm.length/n,.18,.1),Math.round(cm.length/n*100)+"%","доля строк-комментариев");
 if(ct.length>=3)add("Формальные комментарии",ct.filter(c=>/^[A-ZА-Я]/.test(c)&&/[.:]$/.test(c)).length/ct.length,ct.length+" шт.","комментарии с заглавной и точкой, как в учебнике");
 const cc=CC.reduce((a,p)=>a+cnt(low,p),0);add("Шаблонные комментарии",sg(cc/n*100,2,2),cc+" шт.","типовые фразы: «Initialize», «Helper function», «Check if»");
 const fn=(text.match(/\b(def|function|func|fn)\b|=>\s*\{/g)||[]).length,dc=(text.match(/"""|\/\*\*|'''/g)||[]).length/2;
 if(fn>=2)add("Документация функций",dc/fn,Math.round(cl(dc/fn)*100)+"%","docstring/JSDoc у большинства функций");
 const ids=text.match(/\b[a-zA-Z_][a-zA-Z0-9_]{2,}\b/g)||[],sn=ids.filter(x=>/^[a-z0-9]+(_[a-z0-9]+)+$/.test(x)).length,ca=ids.filter(x=>/^[a-z]+([A-Z][a-z0-9]+)+$/.test(x)).length;
 if(sn+ca>=6)add("Единый стиль имён",sg(Math.max(sn,ca)/(sn+ca),.9,.07),Math.round(Math.max(sn,ca)/(sn+ca)*100)+"%","все имена в одном стиле (snake_case или camelCase)");
 if(ids.length){const al=mean(ids.map(x=>x.length));add("Длинные описательные имена",sg(al,8,2),al.toFixed(1)+" симв.","средняя длина идентификаторов")}
 const one=(text.match(/\b[a-z]\b/g)||[]).length;add("Однобуквенные имена",1-sg(one/n,.05,.05),one+" шт.","i, x, n, tmp — привычка людей");
 const tr=L.filter(l=>/[ \t]+$/.test(l)).length/L.length,mx=/^\t/m.test(text)&&/^ {2,}\S/m.test(text);
 add("Небрежность форматирования",1-cl(tr*6+(mx?.5:0)),Math.round(tr*100)+"% строк с хвостом","хвостовые пробелы, смесь табов и пробелов");
 const dbg=(text.match(/console\.log|\bprint\(|TODO|FIXME|XXX|debugger|HACK/g)||[]).length;add("Отладка и TODO",1-sg(dbg/n*100,1,1),dbg+" шт.","забытые print/console.log и TODO");
 const bl=text.split(/\n\s*\n/).map(b=>b.split("\n").length);if(!seg&&bl.length>=4){const c=cv(bl);add("Равномерность блоков",(.8-c)/.5,"CV "+c.toFixed(2),"насколько одинаковы блоки между пустыми строками")}
 const ty=(text.match(/:\s*(int|str|float|bool|string|number|void|List|Dict|Optional)\b|->\s*\w+|catch\s*\(|except\s+\w*Error|except Exception|throw new Error/g)||[]).length;add("Типы и обработка ошибок",sg(ty/n*100,2,2),ty+" шт.","аннотации типов и аккуратная обработка ошибок");
 const c3=cv(ne.map(l=>l.length));add("Вариативность длины строк",(.8-c3)/.5,"CV "+c3.toFixed(2),"насколько меняется длина строк");
 return{F,n,ns:n,found:[]}}

function analyze(text,name,seg,fm){const mode=fm||(isCode(text,name)?"code":"text"),r=mode==="code"?codeF(text,seg):textF(text,seg);
 let z=M.b[mode];r.F.forEach(f=>{f.c=(M.w[f.k]||0)*(f.a-.5);z+=f.c});
 const conf=cl(r.n/(mode==="code"?(seg?10:60):(seg?70:250)));let p=100/(1+Math.exp(-z));p=50+(p-50)*(.45+.55*conf);
 return{...r,mode,z,p,conf}}

function segs(t,mode){const o=[];
 if(mode==="code"){const L=t.split("\n");for(let i=0;i<L.length;i+=20){const c=L.slice(i,i+20);o.push({t:c.join("\n")+"\n",p:c.filter(l=>l.trim()).length>=8?analyze(c.join("\n"),"",1,"code").p:null})}return o}
 t.split(/(\n+)/).forEach(part=>{if(!part.trim()){o.push({t:part});return}
  const items=wc(part)>90?(()=>{const ss=part.match(/[^.!?…]+[.!?…]*\s*/g)||[part],g=[];for(let i=0;i<ss.length;i+=3)g.push(ss.slice(i,i+3).join(""));return g})():[part];
  items.forEach(x=>o.push({t:x,p:wc(x)>=12?analyze(x,"",1,"text").p:null}))});return o}

const prob=(m,d)=>{let z=m.b[d.m];for(const k in d.f)z+=(m.w[k]||0)*(d.f[k]-.5);return 1/(1+Math.exp(-z))};
function fit(D,ep=500){const m={b:{...B0},w:{...PRIOR}},N=D.length;if(!N)return m;
 const cn=[0,0];D.forEach(d=>cn[d.y]++);const sw=D.map(d=>N/(2*Math.max(cn[d.y],1))),lam=.02*50/(50+N),LR=6;
 for(let e=0;e<ep;e++){const gw={},gb={text:0,code:0};
  D.forEach((d,i)=>{const r=(prob(m,d)-d.y)*sw[i]/N;gb[d.m]+=r;for(const k in d.f)gw[k]=(gw[k]||0)+r*(d.f[k]-.5)});
  for(const k in m.w)m.w[k]=cl(m.w[k]-LR*((gw[k]||0)+lam*(m.w[k]-PRIOR[k])),-15,15);
  for(const k in gb)m.b[k]=cl(m.b[k]-LR*(gb[k]+lam*.2*(m.b[k]-B0[k])),-5,5)}
 return m}
function cv5(D){if(D.length<10)return null;const ix=D.map((_,i)=>i).sort(()=>Math.random()-.5);let ok=0;
 for(let k=0;k<5;k++){const m=fit(ix.filter((_,i)=>i%5!==k).map(i=>D[i]),150);ix.filter((_,i)=>i%5===k).forEach(i=>{if((prob(m,D[i])>.5?1:0)===D[i].y)ok++})}return ok/D.length}
const rd=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,Math.round(v*1000)/1000]));
const exportModel=(m,meta)=>({v:2,updated:new Date().toISOString(),meta:meta||{n:0},b:rd(m.b),w:rd(m.w)});
async function load(u){try{const j=await(await fetch((u||"model.json")+"?v="+Date.now())).json();M={b:{...B0,...j.b},w:{...PRIOR,...j.w},meta:j.meta||{}}}catch(e){}return M}

const ld=s=>new Promise((r,j)=>{if(document.querySelector('script[src="'+s+'"]'))return r();const e=document.createElement("script");e.src=s;e.onload=r;e.onerror=()=>j(new Error("Не удалось загрузить библиотеку для этого формата (нужен интернет)"));document.head.appendChild(e)});
const X=h=>h.replace(/<\/(w:p|a:p|p|div|li|tr|text:p|text:h|si|row)>|<br\s*\/?>/gi,"\n").replace(/<[^>]+>/g,"").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,"&");
const JZ="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",PJ="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",PW="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
async function readFile(f){const e=(f.name.split(".").pop()||"").toLowerCase();
 if(["docx","pptx","xlsx","odt","odp","ods","epub"].includes(e)){await ld(JZ);const z=await JSZip.loadAsync(await f.arrayBuffer()),num=a=>+(a.match(/(\d+)\.xml$/)||[0,0])[1];
  const ns=Object.keys(z.files).filter(n=>/(^|\/)(document|content|sharedStrings)\.xml$|slides\/slide\d+\.xml$|\.x?html?$/i.test(n)).sort((a,b)=>num(a)-num(b));
  let o="";for(const n of ns)o+=X(await z.files[n].async("string"))+"\n";return o.trim()}
 if(e==="pdf"){await ld(PJ);pdfjsLib.GlobalWorkerOptions.workerSrc=PW;const d=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;let o="";
  for(let i=1;i<=Math.min(d.numPages,80);i++){const c=await(await d.getPage(i)).getTextContent();o+=c.items.map(x=>x.str+(x.hasEOL?"\n":" ")).join("")+"\n\n"}return o}
 const buf=await f.arrayBuffer();let t=new TextDecoder("utf-8").decode(buf);const h=t.slice(0,4000);
 if((h.match(/\u0000/g)||[]).length>8)throw new Error("«"+f.name+"»: бинарный файл (картинка, аудио, видео, архив) — текста внутри нет.");
 if((h.match(/\uFFFD/g)||[]).length>3)t=new TextDecoder("windows-1251").decode(buf);
 if(e==="rtf")t=t.replace(/\\par[d]?/g,"\n").replace(/\\'[0-9a-f]{2}/g,"").replace(/\\[a-z]+-?\d* ?|[{}]/g,"");
 return t}

const langs=t=>{const w=t.toLowerCase().match(/\p{L}+/gu)||[];let en=0,ru=0,kk=0;w.forEach(x=>{if(/^[a-z’']+$/.test(x))en++;else if(/[әіңғүұқөһ]/.test(x))kk++;else if(/[а-яё]/.test(x))ru++});
 const c=ru+kk;if(c&&kk/c>.06){const mv=Math.round(ru*.6);ru-=mv;kk+=mv}const T=en+ru+kk||1;return[["English",en],["Русский",ru],["Қазақша",kk]].filter(x=>x[1]/T>.03).map(x=>x[0]+" "+Math.round(x[1]/T*100)+"%")};
const verdict=p=>p>=75?["Вероятно, создано ИИ","bad","ИИ"]:p>=58?["Скорее всего, создано ИИ","bad","ИИ"]:p>=42?["Однозначный вывод невозможен","wa","НЕОПРЕДЕЛЁННО"]:p>=25?["Скорее всего, написано человеком","ok","ЧЕЛОВЕК"]:["Вероятно, написано человеком","ok","ЧЕЛОВЕК"];
return{analyze,segs,fit,cv5,prob,exportModel,load,setModel:m=>{M=m},getModel:()=>M,readFile,langs,verdict,esc,wc,PRIOR,isCode}})();
if(typeof module!=="undefined")module.exports=DX;

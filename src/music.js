// Locally synthesized motifs; Christmas uses the public-domain Jingle Bells melody (1857).
export const SOUNDTRACKS={
 classic:{bpm:104,wave:'triangle',notes:[72,76,79,76,74,77,81,77,72,76,79,84,81,79,76,null],bass:[48,53,55,48]},
 christmas:{title:'Jingle Bells',source:'https://www.loc.gov/item/2023812429/',bpm:132,wave:'triangle',monophonic:true,
 events:[[76,1],[76,1],[76,2],[76,1],[76,1],[76,2],[76,1],[79,1],[72,1.5],[74,.5],[76,4],
 [77,1],[77,1],[77,1.5],[77,.5],[77,1],[76,1],[76,1],[76,.5],[76,.5],[76,1],[74,1],[74,1],[76,1],[74,2],[79,2],
 [76,1],[76,1],[76,2],[76,1],[76,1],[76,2],[76,1],[79,1],[72,1.5],[74,.5],[76,4],
 [77,1],[77,1],[77,1],[77,1],[77,1],[76,1],[76,1],[76,.5],[76,.5],[79,1],[79,1],[77,1],[74,1],[72,4],[null,2]],notes:[76,79,72,74,77],bass:[]},
 tet:{bpm:120,wave:'triangle',notes:[74,76,79,81,86,81,79,76,74,79,81,86,88,86,81,null,79,81,86,88,91,88,86,81,79,76,74,76,79,76,74,null],bass:[50,55,57,50]},
 halloween:{bpm:66,wave:'sine',notes:[60,null,67,63,66,null,62,null,60,null,59,63,66,62,55,null],bass:[36,35,32,31]},
};
export function createThemeMusic(getContext,{enabled=true}={}){
 let epoch=0;let theme='classic',unlocked=false,ctx=null,bus=null,timer=null,step=0,next=0,volume=.16;const voices=new Set();
 const midi=n=>440*2**((n-69)/12);
 function tone(note,time,duration,level,wave='sine',detune=0){if(note===null)return;const osc=ctx.createOscillator(),amp=ctx.createGain();osc.type=wave;osc.frequency.value=midi(note);osc.detune.value=detune;const attack=theme==='halloween'?.10:.015;amp.gain.setValueAtTime(0,time);amp.gain.linearRampToValueAtTime(level,time+attack);amp.gain.exponentialRampToValueAtTime(.0001,time+duration);osc.connect(amp).connect(bus);voices.add(osc);osc.onended=()=>{voices.delete(osc);osc.disconnect();amp.disconnect()};osc.start(time);osc.stop(time+duration+.02);}
 function schedule(){if(!ctx||ctx.state!=='running')return;const track=SOUNDTRACKS[theme],beat=60/track.bpm/2;if(next<ctx.currentTime-.2)next=ctx.currentTime+.03;while(next<ctx.currentTime+.22){if(track.monophonic){const [note,length]=track.events[step%track.events.length],duration=60/track.bpm*length;tone(note,next,duration*.87,.35,track.wave);next+=duration;step++;continue;}const n=track.notes[step%track.notes.length];tone(n,next,theme==='halloween'?1.4:.45,.24,track.wave);if(theme==='christmas'&&n!==null)tone(n+12,next,.6,.045,'sine',-3);if(theme==='tet'&&n!==null)tone(n+12,next,.11,.055,'sine');if(step%4===0)tone(track.bass[Math.floor(step/8)%4],next,beat*3.5,.18,'sine');if(theme==='tet'&&step%2===0)tone(38,next,.11,.12,'triangle');if(theme==='halloween'&&step%8===0){tone(48,next,beat*7,.07,'triangle',-8);tone(55,next,beat*7,.055,'triangle',8);}next+=beat;step++;}}
 function stop(){epoch++;clearInterval(timer);timer=null;for(const voice of voices){try{voice.stop()}catch{}}voices.clear();bus?.disconnect();bus=null;}
 async function start(){if(!unlocked||!enabled||document.hidden)return;stop();const ticket=epoch;try{ctx=getContext();await ctx.resume();if(ticket!==epoch||!enabled||document.hidden)return;bus=ctx.createGain();bus.gain.value=volume;bus.connect(ctx.destination);step=0;next=ctx.currentTime+.04;schedule();timer=setInterval(schedule,100);}catch{stop();}}
 function unlock(){if(unlocked)return;unlocked=true;start();}
 document.addEventListener('pointerdown',unlock,{once:true});document.addEventListener('keydown',unlock,{once:true});document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
 return{setTheme(id){const nextTheme=Object.hasOwn(SOUNDTRACKS,id)?id:'classic';if(nextTheme===theme)return;theme=nextTheme;start();},setEnabled(value){enabled=!!value;if(enabled){unlocked=true;start()}else stop();},setVolume(value){volume=Math.max(0,Math.min(.3,value));if(bus)bus.gain.setTargetAtTime(volume,ctx.currentTime,.05);},get diagnostics(){return {playing:!!timer,voices:voices.size,theme,enabled,monophonic:!!SOUNDTRACKS[theme].monophonic}},get enabled(){return enabled},get theme(){return theme}};
}

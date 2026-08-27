"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import "./mapbox.css";
import "./routes.css";
import "./avl.css";
import "./live-assist";
import {ROUTE3_NORTH_STOPS,ROUTE3_SOUTH_STOPS} from "./route3-official";
import {ROUTE5_NORTH_STOPS,ROUTE5_SOUTH_STOPS} from "./route5-official";
import {ROUTE8_NORTH_STOPS,ROUTE8_SOUTH_STOPS} from "./route8-official";
import {ROUTE24_NORTH_STOPS,ROUTE24_SOUTH_STOPS} from "./route24-official";
import {ROUTE11_EAST_STOPS,ROUTE11_WEST_STOPS} from "./route11-official";
import {ROUTE30_NORTH_STOPS,ROUTE30_SOUTH_STOPS} from "./route30-official";
import {ROUTE4_EAST_STOPS,ROUTE4_WEST_STOPS} from "./route4-official";
import {ROUTE14_EAST_STOPS,ROUTE14_WEST_STOPS} from "./route14-official";
import {ROUTE35_NORTH_STOPS,ROUTE35_SOUTH_STOPS} from "./route35-official";
import {ROUTE36_NORTH_STOPS,ROUTE36_SOUTH_STOPS} from "./route36-official";
import {ROUTE26_LOOP_STOPS} from "./route26-official";
import {ROUTE15_EAST_STOPS,ROUTE15_WEST_STOPS} from "./route15-official";
import {ROUTE55_EAST_STOPS,ROUTE55_WEST_STOPS} from "./route55-official";
import {ROUTE95_NORTH_STOPS,ROUTE95_SOUTH_STOPS} from "./route95-official";
import {ROUTE00_NORTH_STOPS,ROUTE00_SOUTH_STOPS} from "./route00-official";
import {ROUTE13_NORTH_STOPS,ROUTE13_SOUTH_STOPS} from "./route13-official";
import {ROUTE18_NORTH_STOPS,ROUTE18_SOUTH_STOPS} from "./route18-official";
import {ROUTE200_NORTH_STOPS} from "./route200-official";
import {ROUTE41_NORTH_STOPS} from "./route41-official";
import {ROUTE43_NORTH_STOPS} from "./route43-official";
import {ROUTE92_NORTH_STOPS,ROUTE92_SOUTH_STOPS} from "./route92-official";
import {ROUTE93_NORTH_STOPS,ROUTE93_SOUTH_STOPS} from "./route93-official";
import {ROUTE94_NORTH_STOPS,ROUTE94_SOUTH_STOPS} from "./route94-official";
import {ROUTE97_NORTH_STOPS,ROUTE97_SOUTH_STOPS} from "./route97-official";
import {ROUTE106_NORTH_STOPS,ROUTE106_SOUTH_STOPS} from "./route106-official";
import {ROUTE120_NORTH_STOPS,ROUTE120_SOUTH_STOPS} from "./route120-official";

type Turn="left"|"right"|"continue";
type Step={action:Turn;street:string;until:string;note?:string};
type Dir={id:string;label:string;origin:string;destination:string;steps:Step[]};
type Route={id:string;number:string;name:string;subtitle:string;directions:Dir[]};
type LiveNavigation={instruction:string;modifier:string;index:number;total:number;provider:"Mapbox"|"operator"};
// Training steps are derived from the official Metro stop sequence.
// The bearing change between consecutive official stops supplies a simple,
// data-driven straight/left/right label for each stop-to-stop segment. Live
// Assist uses the same official shape and asks Mapbox for full maneuvers.
const stopBearing=(a:[number,number],b:[number,number])=>{
 const rad=Math.PI/180, y=Math.sin((b[0]-a[0])*rad)*Math.cos(b[1]*rad), x=Math.cos(a[1]*rad)*Math.sin(b[1]*rad)-Math.sin(a[1]*rad)*Math.cos(b[1]*rad)*Math.cos((b[0]-a[0])*rad);
 return (Math.atan2(y,x)/rad+360)%360;
};
const turnAction=(delta:number):Turn=>delta>35&&delta<145?"right":delta<-35&&delta>-145?"left":"continue";
const officialStopToStopSteps=(stops:{name:string;coordinates:[number,number]}[]):Step[]=>stops.slice(0,-1).map((stop,index)=>{
 const next=stops[index+1], before=stops[Math.max(0,index-1)];
 const action=index===0?"continue":turnAction(((stopBearing(stop.coordinates,next.coordinates)-stopBearing(before.coordinates,stop.coordinates)+540)%360)-180);
 return {action,street:stop.name,until:next.name};
});
const route3NorthSteps=officialStopToStopSteps(ROUTE3_NORTH_STOPS);
const route3SouthSteps=officialStopToStopSteps(ROUTE3_SOUTH_STOPS);
const route5NorthSteps=officialStopToStopSteps(ROUTE5_NORTH_STOPS);
const route5SouthSteps=officialStopToStopSteps(ROUTE5_SOUTH_STOPS);
const route8NorthSteps=officialStopToStopSteps(ROUTE8_NORTH_STOPS);
const route8SouthSteps=officialStopToStopSteps(ROUTE8_SOUTH_STOPS);
const route24NorthSteps=officialStopToStopSteps(ROUTE24_NORTH_STOPS);
const route24SouthSteps=officialStopToStopSteps(ROUTE24_SOUTH_STOPS);
const route11WestSteps=officialStopToStopSteps(ROUTE11_WEST_STOPS);
const route11EastSteps=officialStopToStopSteps(ROUTE11_EAST_STOPS);
const route30NorthSteps=officialStopToStopSteps(ROUTE30_NORTH_STOPS);
const route30SouthSteps=officialStopToStopSteps(ROUTE30_SOUTH_STOPS);
const route4WestSteps=officialStopToStopSteps(ROUTE4_WEST_STOPS);
const route4EastSteps=officialStopToStopSteps(ROUTE4_EAST_STOPS);
const route14WestSteps=officialStopToStopSteps(ROUTE14_WEST_STOPS);
const route14EastSteps=officialStopToStopSteps(ROUTE14_EAST_STOPS);
const route35NorthSteps=officialStopToStopSteps(ROUTE35_NORTH_STOPS);
const route35SouthSteps=officialStopToStopSteps(ROUTE35_SOUTH_STOPS);
const route36NorthSteps=officialStopToStopSteps(ROUTE36_NORTH_STOPS);
const route36SouthSteps=officialStopToStopSteps(ROUTE36_SOUTH_STOPS);
const route26CounterclockwiseSteps=officialStopToStopSteps(ROUTE26_LOOP_STOPS);
const route26ClockwiseSteps=officialStopToStopSteps([...ROUTE26_LOOP_STOPS].reverse());
const route15WestSteps=officialStopToStopSteps(ROUTE15_WEST_STOPS);
const route15EastSteps=officialStopToStopSteps(ROUTE15_EAST_STOPS);
const route55WestSteps=officialStopToStopSteps(ROUTE55_WEST_STOPS);
const route55EastSteps=officialStopToStopSteps(ROUTE55_EAST_STOPS);
const route95PmSteps=officialStopToStopSteps(ROUTE95_NORTH_STOPS);
const route95AmSteps=officialStopToStopSteps(ROUTE95_SOUTH_STOPS);
const route00WestSteps=officialStopToStopSteps(ROUTE00_NORTH_STOPS);
const route00EastSteps=officialStopToStopSteps(ROUTE00_SOUTH_STOPS);
const route13NorthSteps=officialStopToStopSteps(ROUTE13_NORTH_STOPS);
const route13SouthSteps=officialStopToStopSteps(ROUTE13_SOUTH_STOPS);
const route18NorthSteps=officialStopToStopSteps(ROUTE18_NORTH_STOPS);
const route18SouthSteps=officialStopToStopSteps(ROUTE18_SOUTH_STOPS);
const routeGreenSteps=officialStopToStopSteps(ROUTE200_NORTH_STOPS);
const routeBlueSteps=officialStopToStopSteps(ROUTE41_NORTH_STOPS);
const routeYellowSteps=officialStopToStopSteps(ROUTE43_NORTH_STOPS);
const route92NorthSteps=officialStopToStopSteps(ROUTE92_NORTH_STOPS);
const route92SouthSteps=officialStopToStopSteps(ROUTE92_SOUTH_STOPS);
const route93NorthSteps=officialStopToStopSteps(ROUTE93_NORTH_STOPS);
const route93SouthSteps=officialStopToStopSteps(ROUTE93_SOUTH_STOPS);
const route94NorthSteps=officialStopToStopSteps(ROUTE94_NORTH_STOPS);
const route94SouthSteps=officialStopToStopSteps(ROUTE94_SOUTH_STOPS);
const route97NorthSteps=officialStopToStopSteps(ROUTE97_NORTH_STOPS);
const route97SouthSteps=officialStopToStopSteps(ROUTE97_SOUTH_STOPS);
const route106NorthSteps=officialStopToStopSteps(ROUTE106_NORTH_STOPS);
const route106SouthSteps=officialStopToStopSteps(ROUTE106_SOUTH_STOPS);
const route120NorthSteps=officialStopToStopSteps(ROUTE120_NORTH_STOPS);
const route120SouthSteps=officialStopToStopSteps(ROUTE120_SOUTH_STOPS);
const routes:Route[]=[
 {id:"3",number:"3",name:"North 40th / South 42nd",subtitle:"22nd & Cuming ↔ North Omaha / MCC South",directions:[
  {id:"northbound",label:"Northbound",origin:"22nd & Cuming",destination:"North Omaha T.C.",steps:route3NorthSteps},
  {id:"southbound",label:"Southbound",origin:"North Omaha T.C.",destination:"22nd & Cuming",steps:route3SouthSteps}
 ]},
 {id:"11",number:"11",name:"Leavenworth / Aksarben",subtitle:"11th Street ↔ Aksarben Transit Center",directions:[
  {id:"westbound",label:"Westbound",origin:"11th Street",destination:"Aksarben T.C.",steps:route11WestSteps},
  {id:"eastbound",label:"Eastbound",origin:"Aksarben T.C.",destination:"11th Street layover",steps:route11EastSteps}
 ]},
 {id:"5",number:"5",name:"90th Street",subtitle:"North Omaha Transit Center ↔ Westroads Transit Center",directions:[
  {id:"northbound",label:"Northbound",origin:"North Omaha T.C.",destination:"Westroads T.C.",steps:route5NorthSteps},
  {id:"southbound",label:"Southbound",origin:"Westroads T.C.",destination:"North Omaha T.C.",steps:route5SouthSteps}
 ]},
 {id:"8",number:"8",name:"60th / Blondo Street",subtitle:"North Omaha Transit Center ↔ Benson / Crossroads",directions:[
  {id:"northbound",label:"Northbound",origin:"North Omaha T.C.",destination:"Benson / Crossroads",steps:route8NorthSteps},
  {id:"southbound",label:"Southbound",origin:"Benson / Crossroads",destination:"North Omaha T.C.",steps:route8SouthSteps}
 ]},
 {id:"30",number:"30",name:"Aksarben / North Omaha",subtitle:"Aksarben T.C. ↔ 31st & Ferry",directions:[
  {id:"northbound",label:"Northbound",origin:"Aksarben T.C.",destination:"31st & Ferry layover",steps:route30NorthSteps},
  {id:"southbound",label:"Southbound",origin:"31st & Ferry",destination:"Aksarben T.C.",steps:route30SouthSteps}
 ]},
 {id:"4",number:"4",name:"Maple Street",subtitle:"14th & Farnam ↔ Westroads Transit Center",directions:[
  {id:"westbound",label:"Westbound",origin:"14th & Farnam",destination:"Westroads T.C.",steps:route4WestSteps},
  {id:"eastbound",label:"Eastbound",origin:"Westroads T.C.",destination:"14th Street layover",steps:route4EastSteps}
  ]},
 {id:"14",number:"14",name:"108th / Fort Street",subtitle:"North Omaha T.C. ↔ Westroads Transit Center",directions:[
  {id:"westbound",label:"Westbound",origin:"North Omaha T.C.",destination:"Westroads T.C.",steps:route14WestSteps},
  {id:"eastbound",label:"Eastbound",origin:"Westroads T.C.",destination:"North Omaha T.C.",steps:route14EastSteps}
 ]},
 {id:"35",number:"35",name:"North 33rd Street",subtitle:"32nd & Vinton ↔ North Omaha Transit Center",directions:[
  {id:"northbound",label:"Northbound",origin:"32nd & Vinton",destination:"North Omaha T.C.",steps:route35NorthSteps},
  {id:"southbound",label:"Southbound",origin:"North Omaha T.C.",destination:"32nd & Vinton",steps:route35SouthSteps}
 ]},
 {id:"36",number:"36",name:"16th & Vinton Street",subtitle:"32nd & Vinton ↔ Downtown Omaha",directions:[
  {id:"northbound",label:"Northbound",origin:"32nd & Vinton",destination:"16th & Capitol",steps:route36NorthSteps},
  {id:"southbound",label:"Southbound",origin:"16th & Capitol",destination:"32nd & Vinton",steps:route36SouthSteps}
 ]},
 {id:"26",number:"26",name:"North Omaha Circulator",subtitle:"Counterclockwise loop from North Omaha T.C.",directions:[
  {id:"counterclockwise",label:"Counterclockwise",origin:"North Omaha T.C.",destination:"North Omaha T.C.",steps:route26CounterclockwiseSteps},
  {id:"clockwise",label:"Clockwise",origin:"North Omaha T.C.",destination:"North Omaha T.C.",steps:route26ClockwiseSteps}
 ]},
 {id:"15",number:"15",name:"Center Street",subtitle:"22nd & Cuming ↔ Oak View Mall",directions:[
  {id:"westbound",label:"Westbound",origin:"22nd & Cuming",destination:"Oak View Mall",steps:route15WestSteps},
  {id:"eastbound",label:"Eastbound",origin:"Oak View Mall",destination:"22nd & Cuming",steps:route15EastSteps}
 ]},
 {id:"24",number:"24",name:"24th Street",subtitle:"North Omaha Transit Center ↔ MCC South Transit Center",directions:[
  {id:"northbound",label:"Northbound",origin:"MCC South Transit Center",destination:"North Omaha Transit Center",steps:route24NorthSteps},
  {id:"southbound",label:"Southbound",origin:"North Omaha Transit Center",destination:"MCC South Transit Center",steps:route24SouthSteps}
 ]},
 {id:"55",number:"55",name:"Q Street",subtitle:"22nd & Cuming ↔ 118th & Q",directions:[
  {id:"westbound",label:"Westbound",origin:"22nd & Cuming",destination:"118th & Q",steps:route55WestSteps},
  {id:"eastbound",label:"Eastbound",origin:"118th & Q",destination:"22nd & Cuming",steps:route55EastSteps}
  ]},
 {id:"95",number:"95",name:"Bellevue Express",subtitle:"Downtown ↔ Bellevue park-and-rides",directions:[
  {id:"pm-express",label:"PM Express",origin:"22nd & Cuming",destination:"Downtown via Bellevue",steps:route95PmSteps},
  {id:"am-express",label:"AM Express",origin:"Downtown Omaha",destination:"Downtown via Bellevue",steps:route95AmSteps}
 ]},
 {id:"00",number:"ORBT",name:"ORBT — Dodge Street",subtitle:"Downtown ↔ Westroads Transit Center",directions:[
  {id:"northbound",label:"Westbound",origin:"22nd & Cuming",destination:"Westroads Transit Center",steps:route00WestSteps},
  {id:"southbound",label:"Eastbound",origin:"Westroads Transit Center",destination:"Downtown",steps:route00EastSteps}
 ]},
 {id:"13",number:"13",name:"13th Street",subtitle:"Downtown ↔ Aksarben Transit Center",directions:[
  {id:"northbound",label:"Northbound",origin:"Downtown",destination:"Aksarben Transit Center",steps:route13NorthSteps},
  {id:"southbound",label:"Southbound",origin:"Aksarben Transit Center",destination:"Downtown",steps:route13SouthSteps}
 ]},
 {id:"18",number:"18",name:"18th Street",subtitle:"Downtown ↔ Aksarben Transit Center",directions:[
  {id:"northbound",label:"Northbound",origin:"Downtown",destination:"Aksarben Transit Center",steps:route18NorthSteps},
  {id:"southbound",label:"Southbound",origin:"Aksarben Transit Center",destination:"Downtown",steps:route18SouthSteps}
 ]},
 {id:"200",number:"G",name:"Green Route",subtitle:"Downtown circulator",directions:[
  {id:"loop",label:"Circulator",origin:"Downtown",destination:"Downtown",steps:routeGreenSteps}
 ]},
 {id:"41",number:"B",name:"Blue Route",subtitle:"Omaha ↔ Council Bluffs circulator",directions:[
  {id:"loop",label:"Circulator",origin:"Downtown Omaha",destination:"Downtown Omaha",steps:routeBlueSteps}
 ]},
 {id:"43",number:"Y",name:"Yellow Route",subtitle:"Downtown circulator",directions:[
  {id:"loop",label:"Circulator",origin:"Downtown",destination:"Downtown",steps:routeYellowSteps}
 ]},
 {id:"92",number:"92",name:"92 Express",subtitle:"Express service",directions:[
  {id:"northbound",label:"Northbound",origin:"Downtown",destination:"North Omaha",steps:route92NorthSteps},
  {id:"southbound",label:"Southbound",origin:"North Omaha",destination:"Downtown",steps:route92SouthSteps}
 ]},
 {id:"93",number:"93",name:"93 Express",subtitle:"Express service",directions:[
  {id:"northbound",label:"Northbound",origin:"Downtown",destination:"North Omaha",steps:route93NorthSteps},
  {id:"southbound",label:"Southbound",origin:"North Omaha",destination:"Downtown",steps:route93SouthSteps}
 ]},
 {id:"94",number:"94",name:"94 Express",subtitle:"Express service",directions:[
  {id:"northbound",label:"Northbound",origin:"Downtown",destination:"West Omaha",steps:route94NorthSteps},
  {id:"southbound",label:"Southbound",origin:"West Omaha",destination:"Downtown",steps:route94SouthSteps}
 ]},
 {id:"97",number:"97",name:"97 Express",subtitle:"Express service",directions:[
  {id:"northbound",label:"Northbound",origin:"Downtown",destination:"West Omaha",steps:route97NorthSteps},
  {id:"southbound",label:"Southbound",origin:"West Omaha",destination:"Downtown",steps:route97SouthSteps}
 ]},
 {id:"106",number:"106",name:"106",subtitle:"Omaha Metro bus service",directions:[
  {id:"northbound",label:"Northbound",origin:"Downtown",destination:"North Omaha",steps:route106NorthSteps},
  {id:"southbound",label:"Southbound",origin:"North Omaha",destination:"Downtown",steps:route106SouthSteps}
 ]},
 {id:"120",number:"120",name:"120",subtitle:"Omaha Metro bus service",directions:[
  {id:"northbound",label:"Northbound",origin:"Downtown",destination:"North Omaha",steps:route120NorthSteps},
  {id:"southbound",label:"Southbound",origin:"North Omaha",destination:"Downtown",steps:route120SouthSteps}
 ]},
];
const routeSortValue=(number:string)=>{const value=Number(number);return Number.isFinite(value)?value:1000};
const routesByNumber=[...routes].sort((a,b)=>routeSortValue(a.number)-routeSortValue(b.number)||a.number.localeCompare(b.number));
type Screen="home"|"route"|"learn"|"quiz"|"test"|"live"|"progress";
const arrow=(a:Turn)=>a==="left"?"↰":a==="right"?"↱":"↑";
const navigationArrow=(modifier:string,fallback:Turn)=>modifier.includes("left")?"↰":modifier.includes("right")?"↱":modifier.includes("uturn")?"↶":modifier.includes("straight")?"↑":arrow(fallback);
const label=(a:Turn)=>a==="continue"?"Continue":`Turn ${a}`;
const spokenManeuver=(step:Step)=>{
 const road=step.street.toLowerCase(),merge=/on-ramp|interstate|freeway|us-\d|i-\d/.test(road);
 if(step.action==="continue")return `continue straight on ${step.street}`;
 if(merge)return `merge ${step.action} onto ${step.street}`;
 return `turn ${step.action} on ${step.street}`;
};

export default function Home(){
 const[screen,setScreen]=useState<Screen>("home"),[routeId,setRouteId]=useState("11"),[dirId,setDirId]=useState("westbound"),[index,setIndex]=useState(0),[score,setScore]=useState({correct:0,attempts:0}),[feedback,setFeedback]=useState<null|"correct"|"wrong">(null),[started,setStarted]=useState(false),[live,setLive]=useState<"ready"|"tracking"|"off-route">("ready"),[speech,setSpeech]=useState(true),[stopAlerts,setStopAlerts]=useState(true),[liveNavigation,setLiveNavigation]=useState<LiveNavigation|null>(null);
 const speechEnabledRef=useRef(true),stopAlertsRef=useRef(true),spokenRef=useRef(new Map<string,number>()),speechSequenceRef=useRef(0);
 const route=routes.find(r=>r.id===routeId)!,dir=route.directions.find(d=>d.id===dirId)??route.directions[0],step=dir.steps[index]??dir.steps[0],next=dir.steps[index+1],pct=Math.round((index+1)/dir.steps.length*100),mastery=score.attempts?Math.round(score.correct/score.attempts*100):0;
 useEffect(()=>{const s=localStorage.getItem("rt-score");if(s)setScore(JSON.parse(s));const v=localStorage.getItem("rt-speech");if(v!==null){const enabled=v==="true";speechEnabledRef.current=enabled;setSpeech(enabled)}const stops=localStorage.getItem("rt-stop-alerts");if(stops!==null){const enabled=stops==="true";stopAlertsRef.current=enabled;setStopAlerts(enabled)}if("serviceWorker"in navigator)navigator.serviceWorker.register("/sw.js",{updateViaCache:"none"}).then(r=>r.update()).catch(()=>{})},[]);
 const speak=useCallback((text:string,options:{interrupt?:boolean;key?:string;force?:boolean}={})=>{if(typeof window==="undefined"||!("speechSynthesis"in window))return;if(!options.force&&!speechEnabledRef.current)return;const synth=window.speechSynthesis,key=options.key??text,now=Date.now(),last=spokenRef.current.get(key)??0;if(now-last<8000)return;spokenRef.current.set(key,now);const interrupt=options.interrupt!==false,sequence=interrupt?++speechSequenceRef.current:speechSequenceRef.current;if(synth.paused)synth.resume();if(interrupt)synth.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang="en-US";utterance.rate=.92;utterance.pitch=1;utterance.volume=1;const voice=synth.getVoices().find(v=>v.lang.toLowerCase().startsWith("en-us"));if(voice)utterance.voice=voice;const play=()=>{if(interrupt&&sequence!==speechSequenceRef.current)return;if(synth.paused)synth.resume();synth.speak(utterance)};if(interrupt)window.setTimeout(play,40);else play()},[]);
 useEffect(()=>{if(screen!=="live")return;const receive=(event:Event)=>{
  const detail=(event as CustomEvent).detail as {type:string;status?:"tracking"|"off-route";index?:number;nextIndex?:number;finished?:boolean;stopName?:string;stopNumber?:number;instruction?:string;modifier?:string;announcement?:string;total?:number;provider?:"Mapbox"|"operator"};
  const prefix=`${route.id}:${dir.id}`;
  if(detail.type==="status"&&detail.status)setLive(detail.status);
  if(detail.type==="start")speak("GPS guidance started. Locating you on the route.",{interrupt:false,key:`${prefix}:start`});
  if(detail.type==="gps-weak")speak("GPS accuracy is weak. Holding navigation instructions until the location improves.",{key:`${prefix}:gps-weak`});
  if(detail.type==="off-route")speak(`You are off Route ${route.number}. Return to the highlighted route when safe.`,{key:`${prefix}:off-route`});
  if(detail.type==="back-on-route")speak(`You are back on Route ${route.number}.`,{key:`${prefix}:back-on-route`});
  if(detail.type==="wrong-way")speak(`You are traveling opposite the selected ${dir.label} direction. Turn around when safe.`,{key:`${prefix}:wrong-way`});
  if(detail.type==="direction-correct")speak(`Direction corrected. Continuing ${dir.label} guidance.`,{key:`${prefix}:direction-correct`});
  if(detail.type==="stop-ahead"&&stopAlertsRef.current&&detail.stopName)speak(`Bus stop ${detail.stopNumber??""} ahead in 300 feet. ${detail.stopName}.`,{interrupt:false,key:`${prefix}:stop:${detail.stopNumber??detail.stopName}`});
  if(detail.type==="navigation-fallback")setLiveNavigation(null);
  if(detail.index==null)return;
  const key=`${prefix}:${detail.index}`;
  if(detail.instruction&&detail.total){
   const navigation={instruction:detail.instruction,modifier:detail.modifier||"straight",index:detail.index,total:detail.total,provider:detail.provider||"Mapbox"} as LiveNavigation;
   setLiveNavigation(navigation);
   if(detail.type==="mapbox-voice"&&detail.announcement)speak(detail.announcement,{key:`${key}:mapbox:${detail.announcement}`});
   if(detail.type==="acquired")speak(`Location found. ${detail.instruction}.`,{key:`${key}:mapbox-acquired`});
   if(detail.type==="reacquired")speak(`Travel direction confirmed. ${detail.instruction}.`,{key:`${key}:mapbox-reacquired`});
   if(detail.type==="complete"&&detail.finished)speak(`Route complete. You have arrived at ${dir.destination}.`,{key:`${key}:mapbox-complete`});
   return;
  }
  const current=dir.steps[detail.index];if(!current)return;
  if(detail.type==="acquired"){setIndex(detail.index);speak(`Location found. Next, ${spokenManeuver(current)}.${current.note?` ${current.note}.`:""}`,{key:`${key}:acquired`})}
  if(detail.type==="reacquired"){setIndex(detail.index);speak(`Travel direction confirmed. Next, ${spokenManeuver(current)}.`,{key:`${key}:reacquired`})}
  if(detail.type==="prepare")speak(`In about half a mile, prepare to ${spokenManeuver(current)}.`,{key:`${key}:prepare`});
  if(detail.type==="near")speak(`In about 600 feet, ${spokenManeuver(current)}.`,{key:`${key}:near`});
  if(detail.type==="now")speak(`Now, ${spokenManeuver(current)}.`,{key:`${key}:now`});
  if(detail.type==="complete"){const nextIndex=detail.nextIndex??detail.index;setIndex(Math.min(nextIndex,dir.steps.length-1));const following=dir.steps[nextIndex];speak(detail.finished?`Route complete. You have arrived at ${dir.destination}.`:`Turn completed. Next, ${spokenManeuver(following)}.${following.note?` ${following.note}.`:""}`,{key:`${key}:complete`})}
 };window.addEventListener("route-trainer-gps",receive);return()=>window.removeEventListener("route-trainer-gps",receive)},[screen,speak,route.id,route.number,dir]);
 const announceStep=(i=index)=>{if(liveNavigation){speak(liveNavigation.instruction,{key:`manual-mapbox:${route.id}:${dir.id}:${liveNavigation.index}:${Date.now()}`});return}const s=dir.steps[i];speak(`${label(s.action)} on ${s.street}. Continue to ${s.until}.${s.note?` ${s.note}.`:""}`,{key:`manual:${route.id}:${dir.id}:${i}:${Date.now()}`})};
 const toggleSpeech=()=>{const enabled=!speech;speechEnabledRef.current=enabled;setSpeech(enabled);localStorage.setItem("rt-speech",String(enabled));if(enabled)speak("Voice guidance on.",{interrupt:false,key:`voice-on:${Date.now()}`,force:true});else window.speechSynthesis?.cancel()};
 const toggleStopAlerts=()=>{const enabled=!stopAlerts;stopAlertsRef.current=enabled;setStopAlerts(enabled);localStorage.setItem("rt-stop-alerts",String(enabled));if(enabled)speak("Bus stop alerts on.",{key:`stops-on:${Date.now()}`})};
 const go=(s:Screen)=>{setScreen(s);setIndex(0);setLiveNavigation(null);setFeedback(null);setStarted(false);scrollTo(0,0)};
 const chooseRoute=(r:Route)=>{setRouteId(r.id);setDirId(r.directions[0].id);go("route")};
 const advance=()=>{setFeedback(null);setIndex(i=>{const n=i>=dir.steps.length-1?0:i+1;if(screen==="live")setTimeout(()=>announceStep(n),80);return n})};
 const answer=(a:Turn)=>{if(feedback)return;const n={correct:score.correct+(a===step.action?1:0),attempts:score.attempts+1};setScore(n);localStorage.setItem("rt-score",JSON.stringify(n));setFeedback(a===step.action?"correct":"wrong")};
 return <main className="shell"><header className="top"><button className="brand" onClick={()=>go("home")}><b>RT</b> Route Trainer</button><span className="streak">● 4 day streak</span><button className="avatar" onClick={()=>go("progress")}>JD</button></header>
 {screen==="home"&&<section className="page home"><span className="eyebrow">PERSONAL DRIVER TRAINING</span><h1>Know the route.<br/><em>Own every turn.</em></h1><p className="lede">Build confidence one trip at a time. Learn, test, and practice your routes from anywhere.</p><div className="stats"><div><b>{mastery}%</b><small>Overall mastery</small></div><div><b>{routes.length}</b><small>Routes in training</small></div><div><b>{score.attempts-score.correct}</b><small>Turns to review</small></div></div><div className="section-title"><div><span className="eyebrow">YOUR LIBRARY</span><h2>My Routes</h2></div><button disabled>＋ Add route</button></div><div className="route-list">{routesByNumber.map(r=><article className="route-card" key={r.id} onClick={()=>chooseRoute(r)}><div className="badge">{r.number}</div><div><span className="tag">IN TRAINING</span><h3>{r.name}</h3><p>{r.subtitle}</p><div className="bar"><i style={{width:`${Math.max(18,mastery)}%`}}/></div><small>{score.attempts?`${mastery}% mastered`:"Ready to begin"}</small></div><strong>›</strong></article>)}</div><button className="tip" onClick={()=>go("quiz")}><span>✦</span><div><b>Quick practice</b><small>Five minutes now makes the next drive easier.</small></div><strong>Start →</strong></button></section>}
 {screen==="route"&&<section className="page"><button className="back" onClick={()=>go("home")}>← My Routes</button><div className="route-hero"><div className="big-badge">{route.number}</div><div><span className="eyebrow">OMAHA METRO</span><h1>{route.name}</h1><p>Choose a direction, then how you want to train.</p></div></div><div className="tabs">{route.directions.map(d=><button key={d.id} className={dir.id===d.id?"active":""} onClick={()=>{setDirId(d.id);setIndex(0)}}><b>{d.label}</b><small>{d.origin} → {d.destination}</small></button>)}</div><div className="strip"><span>{dir.origin}</span><i/><b>{dir.steps.length} maneuvers</b><i/><span>{dir.destination}</span></div><div className="modes"><Mode icon="⌁" color="amber" title="Learn Route" text="Walk through every maneuver with hints" onClick={()=>go("learn")}/><Mode icon="?" color="blue" title="Turn Quiz" text="Choose left, right, or straight" onClick={()=>go("quiz")}/><Mode icon="✓" color="pink" title="Full Route Test" text="Complete the route from memory" onClick={()=>go("test")}/><Mode icon="⌖" color="green" title="Live Assist" text="GPS-ready guidance with drive simulator" onClick={()=>go("live")}/></div></section>}
 {screen==="learn"&&<Trainer title="Learn Route" route={route} dir={dir} pct={pct} back={()=>go("route")}><div className="card maneuver"><div className="turn">{arrow(step.action)}</div><span className="eyebrow">STEP {index+1} OF {dir.steps.length}</span><h2>{label(step.action)} on<br/><em>{step.street}</em></h2><div className="continue"><small>CONTINUE TO</small><b>{step.until}</b></div>{step.note&&<p className="note">↳ {step.note}</p>}</div><div className="actions"><button disabled={!index} onClick={()=>setIndex(i=>Math.max(0,i-1))}>← Previous</button><button className="primary" onClick={advance}>{index===dir.steps.length-1?"Start again":"Next step →"}</button></div>{next&&<div className="peek"><small>UP NEXT</small><b>{arrow(next.action)} {label(next.action)} on {next.street}</b></div>}</Trainer>}
 {(screen==="quiz"||screen==="test")&&<Trainer title={screen==="quiz"?"Turn Quiz":"Full Route Test"} route={route} dir={dir} pct={pct} back={()=>go("route")}>{screen==="test"&&!started?<div className="card start"><span className="mode-icon pink">✓</span><h2>Ready for the full route?</h2><p>No hints. Complete all {dir.steps.length} maneuvers from {dir.origin} to {dir.destination}.</p><button className="primary" onClick={()=>setStarted(true)}>Begin test</button></div>:<><div className="card question"><span className="eyebrow">YOU ARE ON {index?dir.steps[index-1].street.toUpperCase():dir.origin.toUpperCase()}</span><h2>Approaching <em>{step.street}</em>.<br/>What do you do?</h2><p>Next destination: {step.until}</p></div><div className="answers">{(["left","continue","right"]as Turn[]).map(a=><button key={a} className={feedback?(a===step.action?"correct":"dim"):""} onClick={()=>answer(a)}><span>{arrow(a)}</span><b>{a==="continue"?"Straight":a[0].toUpperCase()+a.slice(1)}</b></button>)}</div>{feedback&&<div className={`feedback ${feedback}`}><div><b>{feedback==="correct"?"That's it.":`Not quite — ${label(step.action)}.`}</b><small>Continue on {step.street} to {step.until}.</small></div><button onClick={advance}>Continue →</button></div>}</>}</Trainer>}
 {screen==="live"&&<section className="live"><header><button onClick={()=>go("route")}>×</button><div><small>ROUTE {route.number} · {dir.label.toUpperCase()}</small><b>{dir.destination}</b></div><button className={`speech-toggle ${speech?"on":""}`} aria-label={speech?"Turn voice guidance off":"Turn voice guidance on"} onClick={toggleSpeech}>{speech?"🔊":"🔇"}</button></header><div className="map" data-route={route.id} data-label={route.number} data-direction={dir.id} data-maneuvers={dir.steps.length}><div className="map-runtime"/><div className="road one"/><div className="road two"/><div className="road three"/><div className="route-line"/><div className={`bus ${live}`}>{route.number}</div><label>ROUTE {route.number} · {dir.label.toUpperCase()}</label></div><div className="live-panel"><div className="avl-runtime"/><div className="live-status"><span className={live}>{live==="ready"?"GPS READY":live==="tracking"?"ON ROUTE":"OFF ROUTE"}</span><small>STEP {(liveNavigation?.index??index)+1} OF {liveNavigation?.total??dir.steps.length}</small></div><div className="voice-state"><div><span>{speech?"🔊 Voice guidance on":"🔇 Voice guidance off"}</span><small>{stopAlerts?"🚏 Stop alerts at 300 ft":"🚏 Stop alerts off"}</small></div><div className="voice-actions"><button onClick={()=>announceStep()}>Hear instruction</button><button className={stopAlerts?"enabled":""} onClick={toggleStopAlerts}>{stopAlerts?"Stops on":"Stops off"}</button></div></div><div className="next"><span>{navigationArrow(liveNavigation?.modifier??"",step.action)}</span><div><small>{liveNavigation?.provider==="Mapbox"?"MAPBOX NEXT MANEUVER":"NEXT MANEUVER"}</small><h2>{liveNavigation?.instruction??`${label(step.action)} on ${step.street}`}</h2><b>{live==="tracking"?"Live GPS":"—"}</b></div></div>{!liveNavigation&&next&&<div className="then">THEN <b>{arrow(next.action)} {label(next.action)} on {next.street}</b></div>}<button className="primary wide" disabled={live!=="ready"} onClick={()=>{if(live==="ready"){speechEnabledRef.current=speech;window.__startRouteGPS?.();setLive("tracking")}}}>{live==="ready"?"Start live GPS":"GPS guidance active"}</button><button className="ghost" onClick={()=>{const off=live!=="off-route";setLive(off?"off-route":"tracking");if(off)speak(`You are off Route ${route.number}. Return to the route when safe.`,{key:`simulate-off:${Date.now()}`})}}>{live==="off-route"?"Return to route":"Simulate off-route"}</button></div></section>}
 {screen==="progress"&&<section className="page"><button className="back" onClick={()=>go("home")}>← Dashboard</button><span className="eyebrow">YOUR TRAINING</span><h1>Progress</h1><div className="score"><div className="ring" style={{"--score":`${mastery}%`}as React.CSSProperties}><span>{mastery}%</span></div><div><h2>Overall mastery</h2><p>{score.attempts} practice answers · {score.correct} correct</p><button className="primary" onClick={()=>go("quiz")}>Practice trouble spots</button></div></div></section>}
 {screen!=="live"&&<nav><button className={screen==="home"?"active":""} onClick={()=>go("home")}><span>⌂</span>Routes</button><button className={screen==="quiz"?"active":""} onClick={()=>go("quiz")}><span>◇</span>Practice</button><button className={screen==="progress"?"active":""} onClick={()=>go("progress")}><span>◔</span>Progress</button><button onClick={()=>alert("Use your browser's Add to Home Screen option to install Route Trainer.")}><span>⇩</span>Install</button></nav>}
 </main>
}
function Mode({icon,color,title,text,onClick}:{icon:string;color:string;title:string;text:string;onClick:()=>void}){return <button onClick={onClick}><span className={`mode-icon ${color}`}>{icon}</span><div><b>{title}</b><small>{text}</small></div><strong>›</strong></button>}
function Trainer({title,route,dir,pct,back,children}:{title:string;route:Route;dir:Dir;pct:number;back:()=>void;children:React.ReactNode}){return <section className="trainer"><header><button onClick={back}>←</button><div><small>ROUTE {route.number} · {dir.label.toUpperCase()}</small><b>{title}</b></div><strong>{pct}%</strong></header><div className="progress"><i style={{width:`${pct}%`}}/></div><div className="training-body">{children}</div></section>}


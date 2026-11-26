const fs=require('node:fs');
const baseline=["5104c4ea:14209","e6639d5c:1297","84bc11c3:357","39a7d72b:9661","3cb9d9d2:470","676e1b9f:1493","3ed7acd2:1670","2a1d2651:1617","f15947cf:1244","feb554c0:1769","57eb5679:2216","2f0763c3:1202","2a7608f0:689","245474fe:554","78644bf7:1602","8c9a6060:1732","f43d6521:1218","1410b2f4:1223","f17690c6:570","c58be0da:1171","1864c2e:690","590717c3:535","2755b3f2:1578","3b2af1ee:399","7d250242:791","ce1fc6cd:654","350db09e:190","e5ff4133:273","efe320b5:427","60b8f90b:138","a4ca0e0c:128","7ba35f74:780","c72f097:1024","d3ef23f:369","c137f2df:309","55144c97:353","d6cd5805:552","f73b2328:1171","d662970e:756","28de31de:290","35417841:781","41f7c23d:139","b5595c:1886","928912ee:209","89ba8200:239"];
function fp(x){let h=2166136261;for(let i=0;i<x.length;i++)h=Math.imul(h^x.charCodeAt(i),16777619);return (h>>>0).toString(16)+':'+x.length;}
const html=fs.readFileSync('index.html','utf8');
const styles=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(x=>x[1]);
let pos=0;for(const style of styles){if(fp(style)===baseline[pos])pos++;}
if(pos!==baseline.length){console.error('UI baseline changed: review required. Matched '+pos+'/'+baseline.length);process.exitCode=1;}else console.log('Existing style blocks preserved. Visual review still required.');

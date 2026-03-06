let allocationChart = null;
let monteChart = null;

function drawAllocationChart(portfolio){

const ctx = document.getElementById("allocationChart");

if(!ctx) return;

const labels = portfolio.map(s => s.ticker);
const values = portfolio.map(s => s.shares * s.buyPrice);

if(allocationChart){
allocationChart.destroy();
}

allocationChart = new Chart(ctx,{
type:'doughnut',
data:{
labels:labels,
datasets:[{
data:values
}]
},
options:{
plugins:{
legend:{
labels:{
color:"white"
}
}
}
}
});

}

function runMonteCarlo(startValue){
const ctx = document.getElementById("monteChart");
if(!ctx) return;

const simulations = 100;
const days = 30;

let allPaths = [];
let avgPath = new Array(days).fill(0);

for(let s = 0; s < simulations; s++){

let values = [];
let value = startValue || 1000;

for(let d = 0; d < days; d++){

value *= 1 + (Math.random()*0.08 - 0.04);

values.push(value);
avgPath[d] += value;

}

allPaths.push(values);

}

avgPath = avgPath.map(v => v / simulations);

let bestPath = allPaths[0];
let worstPath = allPaths[0];

for(const path of allPaths){

if(path[days-1] > bestPath[days-1]) bestPath = path;
if(path[days-1] < worstPath[days-1]) worstPath = path;

}

if(monteChart){
monteChart.destroy();
}

monteChart = new Chart(ctx,{
type:'line',

data:{
labels: Array.from({length:days},(_,i)=>`Day ${i+1}`),

datasets:[

{
label:"Best Case",
data: bestPath,
borderColor:"#22c55e",
borderWidth:3,
pointRadius:0,
tension:0.35
},

{
label:"Expected",
data: avgPath,
borderColor:"#3b82f6",
borderWidth:3,
pointRadius:0,
tension:0.35
},

{
label:"Worst Case",
data: worstPath,
borderColor:"#ef4444",
borderWidth:3,
pointRadius:0,
tension:0.35
}

]
},

options:{
plugins:{
legend:{labels:{color:"white"}}
},

scales:{

x:{
title:{
display:true,
text:"Simulation Period (Days)",
color:"white"
},
ticks:{color:"white"},
grid:{color:"rgba(255,255,255,0.05)"}
},

y:{
title:{
display:true,
text:"Portfolio Value (£)",
color:"white"
},
ticks:{color:"white"},
grid:{color:"rgba(255,255,255,0.05)"}
}

}

}

});

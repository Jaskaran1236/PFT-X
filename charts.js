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

const ctx = document.getElementById("monteCarloChart");

if(!ctx) return;

let values = [];
let value = startValue || 1000;

for(let i=0;i<30;i++){

value *= 1 + (Math.random()*0.08 - 0.04);
values.push(value);

}

if(monteChart){
monteChart.destroy();
}

monteChart = new Chart(ctx,{
type:'line',
data:{
labels: values.map((_,i)=>`Day ${i+1}`),
datasets:[{
label:"Simulated Portfolio Value",
data: values,
borderColor:"#3b82f6",
borderWidth:3,
pointRadius:2,
tension:0.35
}]
},
options:{
plugins:{
legend:{
labels:{ color:"white" }
}
},
scales:{
x:{
ticks:{ color:"white" },
title:{
display:true,
text:"Simulation Period (Days)",
color:"white"
}
},
y:{
ticks:{ color:"white" },
title:{
display:true,
text:"Portfolio Value (£)",
color:"white"
}
}
}
}
});

}

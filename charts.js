let allocationChart
let monteChart;

function runMonteCarlo(startValue){

const ctx = document.getElementById("monteCarloChart")

let values = []
let value = startValue || 1000

for(let i=0;i<30;i++){

value *= 1 + (Math.random()*0.08 - 0.04)

values.push(value)

}

if(monteChart){
monteChart.destroy()
}

monteChart = new Chart(ctx,{
type:'line',

data:{
labels: values.map((_,i)=>`Day ${i+1}`),

datasets:[{
label:"Simulated Portfolio Value",
data: values,
borderColor:"#3b82f6",
backgroundColor:"rgba(59,130,246,0.15)",
borderWidth:3,
pointRadius:3,
tension:0.35
}]
},

options:{

plugins:{
legend:{
labels:{
color:"white"
}
}
},

scales:{

x:{
title:{
display:true,
text:"Simulation Period (Days)",
color:"white"
},
ticks:{
color:"white"
},
grid:{
color:"rgba(255,255,255,0.05)"
}
},

y:{
title:{
display:true,
text:"Portfolio Value (£)",
color:"white"
},
ticks:{
color:"white"
},
grid:{
color:"rgba(255,255,255,0.05)"
}
}

}

}

})

}

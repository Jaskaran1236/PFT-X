function drawAllocationChart(portfolio){

const ctx = document.getElementById("allocationChart")

const labels = portfolio.map(s => s.ticker)
const values = portfolio.map(s => s.shares * s.buyPrice)

new Chart(ctx,{
type:'doughnut',
data:{
labels:labels,
datasets:[{
data:values
}]
}
})

}


function runMonteCarlo(startValue){

const ctx = document.getElementById("monteCarloChart")

let values = []
let value = startValue

for(let i=0;i<50;i++){

value *= 1 + (Math.random()*0.1 - 0.05)

values.push(value)

}

new Chart(ctx,{
type:'line',
data:{
labels:values.map((_,i)=>i),
datasets:[{
data:values
}]
}
})

}

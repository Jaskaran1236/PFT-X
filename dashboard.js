function calculateAIScore(prices){

let score = 50

Object.values(prices).forEach(price =>{

if(price > 100){
score += 5
}else{
score -= 3
}

})

document.getElementById("aiScore").innerText = score

}


function createHeatmap(){

const stocks = [
"AAPL","MSFT","NVDA","TSLA",
"GOOGL","AMZN","META",
"RR.L","RIO","BP"
]

const container = document.getElementById("heatmap")

container.replaceChildren()

stocks.forEach(stock=>{

const change = Math.random()*6 - 3

const box = document.createElement("div")

box.className="p-3 text-center rounded"

box.style.background =
change>0 ? "#14532d" : "#7f1d1d"

box.innerHTML=`
${stock}<br>${change.toFixed(2)}%
`

container.appendChild(box)

})

}


function loadHedgeFunds(){

const data=[

{
fund:"Berkshire Hathaway",
stock:"AAPL",
position:"$170B"
},

{
fund:"Bridgewater",
stock:"SPY",
position:"$4B"
},

{
fund:"Renaissance",
stock:"NVDA",
position:"$2B"
}

]

const table = document.getElementById("hedgeTable")

table.innerHTML=""

data.forEach(row=>{

const tr=document.createElement("tr")

tr.innerHTML=`
<td>${row.fund}</td>
<td>${row.stock}</td>
<td>${row.position}</td>
`

table.appendChild(tr)

})

}


createHeatmap()
loadHedgeFunds()
async function updateTickerBar(){

const tickers = ["AAPL","MSFT","NVDA","TSLA","GOOGL","META"]

const container = document.getElementById("tickerTrack")

let html = ""

for(const ticker of tickers){

const price = await fetchPrice(ticker)

const change = (Math.random()*4 - 2).toFixed(2)

let arrow = "▲"
let color = "text-green-400"

if(change < 0){
arrow = "▼"
color = "text-red-400"
}

html += `
<span class="mx-6 ${color}">
${ticker} £${price?.toFixed(2) || "--"} ${arrow}${Math.abs(change)}%
</span>
`

}

container.innerHTML = html + html

}

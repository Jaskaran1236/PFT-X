let portfolio = []

window.addStock = async function(){

const ticker = document.getElementById("ticker").value.toUpperCase()
const shares = parseFloat(document.getElementById("shares").value)
const buyPrice = parseFloat(document.getElementById("buyPrice").value)

if(!ticker || !shares || !buyPrice){
alert("Enter all values")
return
}

portfolio.push({
ticker,
shares,
buyPrice
})

await updateDashboard()

}

async function fetchPrice(ticker){

try{

const res = await fetch(`/api/stock?ticker=${ticker}`);
const data = await res.json();

return data.price;

}catch(err){

console.error("Price fetch error",err);
return null;

}

}
async function updateDashboard(){

let totalValue = 0
let totalCost = 0
const prices = {}

for(const stock of portfolio){

const price = await fetchPrice(stock.ticker)

prices[stock.ticker] = price
stock.currentPrice = price || stock.buyPrice
if(price){
totalValue += stock.shares * price
}
totalCost += stock.shares * stock.buyPrice

}

const profit = totalValue - totalCost

document.getElementById("portfolioValue").innerText =
"£" + totalValue.toFixed(2)

document.getElementById("portfolioProfit").innerText =
"£" + profit.toFixed(2)

calculateAIScore(prices)

drawAllocationChart(portfolio)

runMonteCarlo(totalValue)
const now = new Date().toLocaleTimeString()

document.getElementById("lastUpdated").innerText =
`Last updated: ${now}`
setInterval(updateDashboard,15000)
  setInterval(updateTickerBar,15000)
  updateTickerBar()
}


let portfolio = []

function addStock(){

const ticker = document.getElementById("ticker").value.toUpperCase()
const shares = parseFloat(document.getElementById("shares").value)
const buyPrice = parseFloat(document.getElementById("buyPrice").value)

portfolio.push({
ticker,
shares,
buyPrice
})

updateDashboard()

}

async function fetchPrice(ticker){

try{

const res = await fetch(`/api/stock?ticker=${ticker}`)
const data = await res.json()

return data.price

}catch{

return 0

}

}

async function updateDashboard(){

let totalValue = 0
let totalCost = 0

const prices = {}

for(const stock of portfolio){

const price = await fetchPrice(stock.ticker)

prices[stock.ticker] = price

totalValue += stock.shares * price
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

}

const QuantEngine = (function(){

let portfolio = [];
let history = {};
let portfolioHistory = [];

let performanceChart;
let frontierChart;

async function safeFetch(symbol){
  try{
    const res = await fetch(`/api/stock?symbol=${symbol}`);
    if(!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function calculateReturns(prices){
  const returns = [];
  for(let i=1;i<prices.length;i++){
    returns.push(Math.log(prices[i]/prices[i-1]));
  }
  return returns;
}

function covariance(a,b){
  const meanA = a.reduce((x,y)=>x+y,0)/a.length;
  const meanB = b.reduce((x,y)=>x+y,0)/b.length;

  let cov = 0;
  for(let i=0;i<a.length;i++){
    cov += (a[i]-meanA)*(b[i]-meanB);
  }
  return cov/(a.length-1);
}

function generateCovarianceMatrix(returnsMatrix){
  const size = returnsMatrix.length;
  const matrix = [];

  for(let i=0;i<size;i++){
    matrix[i] = [];
    for(let j=0;j<size;j++){
      matrix[i][j] = covariance(returnsMatrix[i],returnsMatrix[j]);
    }
  }
  return matrix;
}

function portfolioVariance(weights, covMatrix){
  let variance = 0;
  for(let i=0;i<weights.length;i++){
    for(let j=0;j<weights.length;j++){
      variance += weights[i]*weights[j]*covMatrix[i][j];
    }
  }
  return variance;
}

function randomWeights(n){
  const weights = [];
  let sum = 0;
  for(let i=0;i<n;i++){
    const w = Math.random();
    weights.push(w);
    sum += w;
  }
  return weights.map(w=>w/sum);
}

function buildFrontier(expectedReturns, covMatrix){
  const points = [];

  for(let i=0;i<1500;i++){
    const w = randomWeights(expectedReturns.length);

    const ret = w.reduce((acc,val,idx)=>acc+val*expectedReturns[idx],0);
    const variance = portfolioVariance(w,covMatrix);
    const risk = Math.sqrt(variance);

    points.push({risk,ret});
  }

  return points;
}

function updateCharts(frontierData){

  if(!frontierChart){
    frontierChart = new Chart(
      document.getElementById("frontierChart"),
      {
        type: "scatter",
        data: { datasets: [{
          data: frontierData,
          backgroundColor: "rgba(59,130,246,0.4)"
        }]},
        options: { responsive:true }
      }
    );
  } else {
    frontierChart.data.datasets[0].data = frontierData;
    frontierChart.update();
  }
}

async function addAsset(){
  const symbol = document.getElementById("symbolInput").value.toUpperCase();
  const shares = Number(document.getElementById("sharesInput").value);

  if(!symbol || !shares) return;

  portfolio.push({symbol,shares});
  await refresh();
}

async function refresh(){

  const returnsMatrix = [];
  const expectedReturns = [];

  for(const asset of portfolio){

    const data = await safeFetch(asset.symbol);
    if(!data || !data.history) continue;

    const prices = data.history;
    history[asset.symbol] = prices;

    const returns = calculateReturns(prices);
    returnsMatrix.push(returns);

    const meanReturn = returns.reduce((a,b)=>a+b,0)/returns.length;
    expectedReturns.push(meanReturn);
  }

  if(returnsMatrix.length === 0) return;

  const covMatrix = generateCovarianceMatrix(returnsMatrix);
  const frontierData = buildFrontier(expectedReturns,covMatrix);

  updateCharts(frontierData);
}

return {
  addAsset
};

})();

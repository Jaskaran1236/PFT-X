export default async function handler(req, res) {

const { ticker } = req.query;

if(!ticker){
return res.status(400).json({error:"Ticker required"});
}

try{

const response = await fetch(
`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`
);

const data = await response.json();

const price = data.quoteResponse.result[0].regularMarketPrice;

res.status(200).json({
ticker,
price
});

}catch(err){

res.status(500).json({error:"Failed to fetch price"});

}

}

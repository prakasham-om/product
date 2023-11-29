// import axios from 'axios';
// import cron from 'node-cron'
// const fetchBanknifty=async()=>{
//     try{
//         const apiUrl = `https://www.nseindia.com/api/option-chain-indices?symbol=BANKNIFTY`;
//         const response = await axios.get(apiUrl, {
//             headers: {
//               'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
//               'Accept-Language': 'en-US,en;q=0.9',
//               'Accept': 'application/json',
//             },
//           });
      
//           const optionChainData = response.data.filtered.data;
//         //  console.log(optionChainData);
//           return optionChainData;
//     }
//     catch(err){
//         console.log(err);
//     }
// }




// const banknifty=await fetchBanknifty()

// export default banknifty;
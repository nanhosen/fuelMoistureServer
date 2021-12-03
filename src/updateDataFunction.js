const papa = require("papaparse");
const fs = require('fs')
// var FormData = require('form-data');
// const axios = require('axios')
var request = require("request");
require('dotenv').config()




function doRequest(options) {
  return new Promise(function (resolve, reject) {
    request(options, function (error, res, body) {
      if (!error && res.statusCode == 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
}


const getData = async(gacc)=>{
	// const form = new FormData()
	// form.append('gacc', 'EGBC')
	// form.append('state', 'Select')
	// await form.submit('https://www.wfas.net/nfmd/public/download_data.php', function(err, res) {
	// await form.submit('https://www.wfas.net/nfmd/public/download_data.php', function(err, res) {
  // res – response object (http.IncomingMessage)  //
  // console.log('res', res.resume())
	  // res.resume();
	// })
	// await form.submit({
	//   host: 'https://www.wfas.net/nfmd/public',
	//   path: '/download_data.php',
	//   headers: {
	//   	'gacc': gacc,
	//   	'Content-Type': 'application/x-www-form-urlencoded'
	//   }
	// }, function(err, res) {
	//   console.log(res);
	// });



	var options = { method: 'POST',
	  url: 'https://www.wfas.net/nfmd/public/download_data.php',
	  headers: 
	   { 'postman-token': '9eacc208-b619-ad5f-e1f9-2612b2ceb4c1',
	     'cache-control': 'no-cache',
	     gacc: gacc,
	     'x-requested-with': 'XMLHttpRequest',
	     'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
	  formData: { gacc: gacc , state: 'Select' } };

	  const data = await doRequest(options)
	  // console.log('data', data)
	  return data

	// const response = await request(options, function (error, response, body) {
	//   if (error) throw new Error(error);

	//   console.log(body);
	//   return body
	// });



	// axios({
	//   method: 'post',
	//   url: 'https://www.wfas.net/nfmd/public/download_data.php',
	//   headers: 
	//    { 'postman-token': '9eacc208-b619-ad5f-e1f9-2612b2ceb4c1',
	//      'cache-control': 'no-cache',
	//      gacc: 'EGBC',
	//      'x-requested-with': 'XMLHttpRequest',
	//      'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
	//   formData: { gacc: 'EGBC', state: 'Select' } 
	// })
	// .then(g=>{console.log('g', g)});
}	


// var request = require("request");

// var options = { method: 'POST',
//   url: 'https://www.wfas.net/nfmd/public/download_data.php',
  // headers: 
  //  { 'postman-token': '9eacc208-b619-ad5f-e1f9-2612b2ceb4c1',
  //    'cache-control': 'no-cache',
  //    gacc: 'EGBC',
  //    'x-requested-with': 'XMLHttpRequest',
  //    'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
  // formData: { gacc: 'EGBC', state: 'Select' } };

// request(options, function (error, response, body) {
//   if (error) throw new Error(error);

//   console.log(body);
// });



const firstFunction = async(GACC, s3)=>{
	try{
		const climoOb = {}
		const currYearOb = {}
		const filePath = `./data/${GACC}_data.txt`
		const savePath = `./data/${GACC}_json.json`
		const keyName = `${GACC}_json.json`
		// const txtData = await fs.readFileSync(filePath, 'utf8')
		const requestedData = await getData(GACC)
		// console.log(requestedData.toString())

		const txtToJson = papa.parse(requestedData.toString(),{header: true})
		// console.log('txtToJson', JSON.stringify(txtToJson))
		// const txtToJson = papa.parse(txtData,{header: true})
		// const txtToJson = papa.parse(txtData,{header: true})
		txtToJson.data.map((currOb, i) =>{
			const {GACC, State, Group, Site, Fuel, Percent} = currOb
			const obDate = currOb.Date
			const obYear = new Date(obDate).getFullYear()
			const {monthNum, monthPart} = getMonthInfo(obDate)
			// if(i<250){

				if(!currYearOb[Site]){
					currYearOb[Site]={gacc:GACC, group: Group, state: State}
				}
				if(!currYearOb[Site][Fuel]){
					currYearOb[Site][Fuel] = {obs:[], obDates:[], averages:{}}
				}
				// if(!currYearOb[Site][Fuel]['obs'][obDate]){
				// 	currYearOb[Site][Fuel]['obs'][obDate] =[]
				// }

				if(currYearOb[Site][Fuel]['obDates'].indexOf(obDate)<=0){
					currYearOb[Site][Fuel]['obDates'].push(obDate)
					currYearOb[Site][Fuel]['obs'].push(Percent)
				}


				if(!currYearOb[Site][Fuel]['averages'][monthNum]){
					currYearOb[Site][Fuel]['averages'][monthNum] = {first:[], second:[]}
				}
				if(obYear !== new Date().getFullYear()){

					currYearOb[Site][Fuel]['averages'][monthNum][monthPart].push(Percent)
				}
			// }
			

			if(Site == 'Simco'){
				// console.log('curr ob', currOb, JSON.stringify(currYearOb))
			}
			// console.log('date', new Date(obDate), getMonthInfo(obDate))
			
			// if(i<100){

			
			// }

		})
			console.log('currYearOb done', GACC)
			console.log(JSON.stringify(currYearOb))
			// await fs.writeFileSync(savePath, JSON.stringify(currYearOb));
			const uploadParams = { Bucket: 'fuel-moisture', Key: keyName, Body: JSON.stringify(currYearOb), ACL:'public-read' }
      const uploaded = await s3.upload(uploadParams).promise()
      console.log('file uploaded', uploaded)
		

	}
	catch(e){
		console.log('try error', e)
	}
}



const getMonthInfo = (date) =>{
	const currentDate = new Date(date);
	const monthNum = currentDate.getMonth() + 1
	const day = currentDate.getDate()
	const monthPart = day < 15 ? "first" : "second"
	// if(day<15){
	// 	console.log('fisrt ', day)
	// }
	// else{
	// 	console.log('second', day)
	// }
	// var oneJan = new Date(currentDate.getFullYear(),0,1);
	// var numberOfDays = Math.floor((currentDate - oneJan) / (24 * 60 * 60 * 1000));
	// var result = Math.ceil(( currentDate.getDay() + 1 + numberOfDays) / 7);
	// console.log(`The week number of the current date (${currentDate}) is ${result}.`);
	return {monthNum, monthPart}
}

const fullFunction = async()=>{
	console.log('running full function')
	var AWS = require('aws-sdk');
	// Set the region
	AWS.config.update({region: 'us-east-2'});

	// Create S3 service object
	const s3 = new AWS.S3({
		apiVersion: '2006-03-01',
		accessKeyId: process.env.ACCESSKEYID,
		secretAccessKey: process.env.SECRETACCESSKEY
	});
  const gaccArray = ['AICC', 'EACC', 'NOCC', 'NRCC', 'NWCC', 'RMCC', 'SACC', 'SOCC', 'SWCC', 'WGBC', 'EGBC']
  // const gaccArray = [ 'EGBC']

	for await(var gacc of gaccArray){
		await firstFunction(gacc, s3)
	}
}

// fullFunction()
module.exports = fullFunction
// firstFunction('WGBC')
// getData('WGBC')
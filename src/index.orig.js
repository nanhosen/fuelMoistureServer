

exports.handler = async (event) => {
  const makeText = require('./updateDataFunction.js')
  const response = {
    statusCode:null,
    error:null
  }
  try{
    const res = await makeText()
    response.statusCode = 200
    response.res = JSON.stringify(res)
  }
  catch(e){
    console.log('error', e)
    response.statusCode = 500
    response.error = e
  }
  finally{
    return response
  }

};

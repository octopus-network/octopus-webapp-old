const pgp = require('pg-promise')({
  noWarnings: true
});

const counterDB = pgp(process.env.COUNTER_DB_URL);

exports.handler = async (req) => {
  try {
    const { appchain } = req.queryStringParameters;
    if (!appchain) {
      throw Error('Mission parameter(s)');
    }
    
    const rows = await counterDB
      .query(`SELECT * FROM appchain_snapshot WHERE appchain_id = '${appchain}'`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: rows
      })
    }
  } catch(err) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: false,
        message: err.toString()
      })
    }
  }
}
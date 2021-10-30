const {createProxyMiddleware} = require('http-proxy-middleware');
const NETWORK = process.env.REACT_APP_OCT_NETWORK || 'mainnet';

module.exports = function (app) {
  app.use(
    createProxyMiddleware(
      '/api',
      {
        target: `https://${NETWORK}.oct.network`,
        changeOrigin: true,
        secure: false,    
      }
    )
  );
};
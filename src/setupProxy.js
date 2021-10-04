const {createProxyMiddleware} = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    createProxyMiddleware(
      '/api',
      {
        target: 'https://testnet.oct.network',
        changeOrigin: true,
        secure: false,    
      }
    )
  );
};
'use strict';

/**
 * Module dependencies
 */
var io = require('socket.io-client');
var NodeRSA = require('node-rsa');

/**
 * Authentication Controller
 *
 * This is merely meant as an example of how your Authentication controller
 * should look. It currently includes the minimum amount of functionality for
 * the basics of Passport.js to work.
 */
var SocketController = {
  /**
   * Log out a user and return them to the homepage
   *
   * Passport exposes a logout() function on req (also aliased as logOut()) that
   * can be called from any route handler which needs to terminate a login
   * session. Invoking logout() will remove the req.user property and clear the
   * login session (if any).
   *
   * For more information on logging out users in Passport.js, check out:
   * http://passportjs.org/guide/logout/
   *
   * @param {Object} req
   * @param {Object} res
   */
  connect: function(req, res) {
    var socket = io.connect('http://localhost:1337', {
      'reconnect': true
    });

    sails.rsaKey = {};
    sails.token = "eyJhbGciOiJIUzI1NiJ9.MQ.Lu-KcR4aCeuT9hi1K474zV3s4VaopLDCcf4nZvH6DQo";

    /**
     * Open socket with SaaS
     *
     */
    socket.on('connect', function(data) {
      console.log('Local server connected');

      // Generate RSA key
      sails.rsaKey.local = new NodeRSA({
        b: 2048
      });

      /**
       * Get publicKey to encrypt our secret data safely
       *
       */
      socket.emit('getPublicKey', null, function(publicKey) {
        if (publicKey) {
          // Import SaaS public key
          var saasPublickey = new NodeRSA();
          saasPublickey.importKey(publicKey, 'public');

          sails.rsaKey.saas = saasPublickey;

          // Generate object to send to SaaS

          // Development
          var object = {
            "appId": 1,
            "appName": "Coucou",
            "publicKey": sails.rsaKey.local.exportKey('public'),
            "secretKey": "BUt3XeKlnNw0dzDoDiVzugVcFNJETB3W0NyyEoLXpXk/F1ySsIlm/+ZYHUFiUf1eltxZ85VlMPKF+Bi1K+lZAA==",
            "token": sails.token,
            "env": process.env.NODE_ENV
          };

          // Other env
          // var object = {
          //   "appId": 1,
          //   "appName": "Coucou",
          //   "publicKey": sails.rsaKey.local.exportKey('public'),
          //   "secretKey": "BUt3XeKlnNw0dzDoDiVzugVcFNJETB3W0NyyEoLXpXk/F1ySsIlm/+ZYHUFiUf1eltxZ85VlMPKF+Bi1K+lZAA==",
          //   "env": 'production'
          // };

          socket.emit('check', sails.rsaKey.saas.encrypt(object));
        } else {
          console.log('Error occured');
        }
      });
    });

    socket.on('authorized', function(data) {
      var decryptedData = sails.rsaKey.local.decrypt(data, 'json');

      if (decryptedData.status === "ok") {
        console.log("That's ok!");
        // Dev
        socket.emit('testEncryption', {
          "appId": 1,
          "token": "eyJhbGciOiJIUzI1NiJ9.MQ.Lu-KcR4aCeuT9hi1K474zV3s4VaopLDCcf4nZvH6DQo",
          "encrypted": sails.rsaKey.local.encryptPrivate({
            "secretKey": "BUt3XeKlnNw0dzDoDiVzugVcFNJETB3W0NyyEoLXpXk/F1ySsIlm/+ZYHUFiUf1eltxZ85VlMPKF+Bi1K+lZAA==",
            "data": "ok"
          })
        });

        // Other env
        // socket.emit('testEncryption', {
        //   "appId": 1,
        //   "env": "production",
        //   "encrypted": sails.rsaKey.local.encryptPrivate({
        //     "secretKey": "BUt3XeKlnNw0dzDoDiVzugVcFNJETB3W0NyyEoLXpXk/F1ySsIlm/+ZYHUFiUf1eltxZ85VlMPKF+Bi1K+lZAA==",
        //     "data": "ok"
        //   })
        // });
      } else {
        console.log("Error occured");
      }
    });

    /**
     * Pull global sails var on server
     *
     */
    socket.on('pull', function(data, fn) {
      if (data.from === sails.token) {
        fn(sails);
      }
    });

    socket.on('reload', function(data) {
      // If data.appId, you have to update the appId
      // and reload the server after
      console.log(data);
    });

    socket.on('err', function(data) {
      console.log(data.text);
    });

    res.send({});
  }
};

module.exports = SocketController;
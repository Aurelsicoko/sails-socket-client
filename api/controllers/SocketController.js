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
      reconnect: true
    });

    sails.rsaKey = {};

    socket.on('connect', function(data) {
      console.log('Local server connected');

      // Generate RSA key
      sails.rsaKey.local = new NodeRSA({
        b: 2048
      });

      socket.emit('getPublicKey', null);
    });

    socket.on('gotPublicKey', function(publicKey) {
      // Import SaaS public key
      var saasPublickey = new NodeRSA();
      saasPublickey.importKey(publicKey, 'public');

      sails.rsaKey.saas = saasPublickey;

      // Generate object to send to SaaS
      var object = {
        "appId": 1,
        "appName": "Coucou",
        "publicKey": sails.rsaKey.local.exportKey('public'),
        "secretKey": "0123456789",
        "token": "eyJhbGciOiJIUzI1NiJ9.MQ.Lu-KcR4aCeuT9hi1K474zV3s4VaopLDCcf4nZvH6DQo",
        "env": process.env.NODE_ENV
      };

      socket.emit('check', sails.rsaKey.saas.encrypt(object));
    });

    socket.on('authorized', function(data) {
      var decryptedData = sails.rsaKey.local.decrypt(data, 'json');

      if (decryptedData.status === "ok") {
        console.log("That's ok!");
        socket.emit('testEncryption', {
          "appId": 1,
          "token": "eyJhbGciOiJIUzI1NiJ9.MQ.Lu-KcR4aCeuT9hi1K474zV3s4VaopLDCcf4nZvH6DQo",
          "data": sails.rsaKey.local.encryptPrivate({
            "text": "ok"
          })
        });
      } else {
        console.log("Error occured");
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
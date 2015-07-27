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

    socket.on('connect', function(data) {
      console.log('Local server connected');

      sails.RSAKey = new NodeRSA({
        b: 2048
      });

      socket.emit('associateKey', {
        "appId": "c54ccf663ab4639a0e0ff421d7b0563f",
        "publicKey": sails.RSAKey.exportKey('public')
      });
    });

    socket.on('associatedKey', function(data) {
      console.log(data);

      var encrypted = sails.RSAKey.encryptPrivate({
        "appId": "c54ccf663ab4639a0e0ff421d7b0563f",
        "appName": "Coucou",
        "token": "77baeb53422ca9b9d5b3be10d915cbbf"
      }, 'base64');

      socket.emit('checkApp', encrypted);
    });

    socket.on('authorized', function(data) {
      console.log(data.text);
    });

    socket.on('err', function(data) {
      console.log(data.text);
    });

    res.send({});
  }
};

module.exports = SocketController;
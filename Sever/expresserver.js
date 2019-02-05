'use strict';

var express = require('express')
    , path = require('path')
    , jwt = require('jsonwebtoken')
    , shortid = require('shortid')
    , config = require('./expresserver_config.json')
    , webRoot, app;

// resolve the path to the web root
webRoot = path.resolve(__dirname, '../Client');
app = express();
app.use('/static', express.static(webRoot));

// handle authentication under /auth
app.post('/auth', function (req, res) {
    var profile = {id: shortid.generate()}
    var token = jwt.sign(profile, config.secret, { expiresIn : 5*60*60 });

    res.json({token: token});
});

// redirect all other requests to our index.html file
app.get('/', function(req, res) {
    res.sendFile('index.html', {root: webRoot});
});

module.exports = app;

'use strict';

let express = require('express');
let app = express();
let serv = require('http').Server(app);
var bodyParser = require('body-parser');

var Entity = require("./server/Entity.js");

// for database
var registerController = require('./controllers/register-controller.js');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());


app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});

app.post('', function(req, res) {
  var userCGI = req.body.user
  var user = userCGI.split(' ');
  let userToregister = new registerController(user[0], user[1]);
  userToregister.register();
  res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

serv.listen(3001);
require('dns').lookup(require('os').hostname(), function(err, add, fam) {
  console.log('addr: ' + add);
});
console.log("Server connected");

let io = require('socket.io')(serv, {});

io.sockets.on('connection', function(socket) {
  socket.id = Math.random();
  Entity.SOCKET_LIST[socket.id] = socket;

  //cb() is ansynhronous function, thanks to her we can use queries
  var connection = require('./config');
  let authenticate = function(data, cb) {
    var login = data.login;
    var password = data.password;
    connection.query('SELECT * FROM users WHERE login = ?', [login], function(error, results, fields) {
      if (error) {
        console.log("There some error with controller");
        cb(false)
      } else {
        if (results.length > 0) {
          if (password == results[0].password) {
            console.log("successfully authenticated");
            cb(true);
          } else {
            console.log("Login and password does not match");
            cb(false);
          }
        } else {
          console.log("Login does not exist");
          cb(false);
        }
      }
    });
  }

  socket.on('screen', function(data) {
    Entity.Screen.setSize(data.bodyWidth, data.bodyHeight, data.screenWidth, data.screenHeight);
  })

  socket.on('signIn', function(data) {

    authenticate(data, function(res) {
      if (res) {
        Entity.Player.onConnect(socket, data.login);
        socket.emit("signInResponse", {
          success: true
        });
      } else {
        socket.emit("signInResponse", {
          success: false
        });
      }
    });
  });

  socket.on('disconnect', function() {
    Entity.Player.onDisconnect(socket);
  });

  // socket.on("evalServer", function(data) {
  //   let res = eval(data); //eval means execute data
  //   socket.emit('evalAnswer', res);
  // });
});


setInterval(function() {

  let pack = Entity.Entity.getFrameUpdateData();

  for (let key in Entity.SOCKET_LIST) {
    let socket = Entity.SOCKET_LIST[key];
    socket.emit('update', pack.updatePack);
    socket.emit('init', pack.initPack);
    socket.emit('delete', pack.deletePack);
    if (Entity.PLAYER_LIST[key] != undefined && Entity.PLAYER_LIST[key].radius < 48) {

      socket.emit('death');
      Entity.SOCKET_LIST[key].disconnect();
      continue;
    }

  }
}, 1000 / 25);

// Used for checking if our code is effective, we have to open output file in our browser, with JavaScriptProfiler Tool
// let profiler = require('v8-profiler');
// let fs = require('fs');
// let startProfiling = function(duration){
// 	profiler.startProfiling('1', true);
// 	setTimeout(function(){
// 		let profile1 = profiler.stopProfiling('1');
//
// 		profile1.export(function(error, result) {
// 			fs.writeFile('./profile.cpuprofile', result);
// 			profile1.delete();
// 			console.log("Profile saved.");
// 		});
// 	},duration);
// }
// startProfiling(10000);

'use strict';
// var mongojs = require('mongojs');
 var db = null; //mongojs('localhost:27017/myGame', ['account', 'progress']);

var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log("Server started.");

var SOCKET_LIST = {};
var PLAYER_LIST = {};
var BULLET_LIST = {};

class Entity {
  constructor() {
    this.x = 250;
    this.y = 250;
    this.speedX = 0;
    this.speedY = 0;
    this.id = "";
  }

  updatePosition() {
    this.x += this.speedX;
    this.y += this.speedY;
  }

  update() {
    this.updatePosition();
  }

};

class Player extends Entity {
  constructor(id) {
    super();
    this.id = id;
    this.number = "" + Math.floor(10 * Math.random());
    this.pressingRight = false;
    this.pressingLeft = false;
    this.pressingUp = false;
    this.pressingDown = false;
    this.maxSpeed = 10;
    this.hp = 10;
    this.maxHp = 10;
    this.score = 10;
  }

  updateSpeed() {
    if (this.pressingRight == true)
      this.speedX = this.maxSpeed;
    else if (this.pressingLeft == true)
      this.speedX = -this.maxSpeed;
    else
      this.speedX = 0;

    if (this.pressingUp == true)
      this.speedY = -this.maxSpeed;
    else if (this.pressingDown == true)
      this.speedY = this.maxSpeed;
    else
      this.speedY = 0;
  }

  superUpdate() {
    super.update();
  }

  update() {
    this.superUpdate();
    this.updateSpeed();
  }

  static updatePlayer() {
    var pack = [];
    for (var i in PLAYER_LIST) {
      var player = PLAYER_LIST[i];
      player.update();
      pack.push(player.getUpdatePack());
    }
    return pack;
  }

  getUpdatePack(){
    var updatePack = {
      id:this.id,
      x:this.x,
      y:this.y,
      hp:this.hp,
      score:this.score
    };
    return updatePack;
  }

  getInitPack(){
    var initPack = {
      id:this.id,
      x:this.x,
      y:this.y,
      number: this.number,
      hp:this.hp,
      maxHp: this.maxHp,
      score:this.score
    };
    return initPack;
  }

  static getAllInitPacks(){
    var players = [];
    for (var i in PLAYER_LIST){
      players.push(PLAYER_LIST[i].getInitPack());
    }
    return players;
  }

  static onConnect(socket) {
    let player = new Player(socket.id);
    PLAYER_LIST[socket.id] = player;
    initPack.player.push(player.getInitPack());
    console.log(player.x);
    socket.on('keyPress', function(data) {
      if (data.inputId === 'left')
        player.pressingLeft = data.state;
      else if (data.inputId === 'right')
        player.pressingRight = data.state;
      else if (data.inputId === 'up')
        player.pressingUp = data.state;
      else if (data.inputId === 'down')
        player.pressingDown = data.state;
      else if (data.inputId === 'leftMouseButton'){
        Bullet.shotBullet(data.x, data.y, socket.id);

      }

    });
    socket.emit('init',{
      id: socket.id,
      player: Player.getAllInitPacks(),
      bullet: Bullet.getAllInitPacks()
    });
  }

  static onDisconnect(socket) {
    delete SOCKET_LIST[socket.id];
    delete PLAYER_LIST[socket.id];
    deletePack.player.push(socket.id);
  }

};

class Bullet extends Entity {

  constructor(x, y, parent) {
    super();
    this.parent = parent;
    this.x = PLAYER_LIST[parent].x+10;
    this.y = PLAYER_LIST[parent].y-10;
    this.angle = Math.atan((y - this.y)/(x - this.x));
    if((x - this.x) < 0)
      this.angle += Math.PI;
    this.id = Math.random();
    this.speedX = Math.cos(this.angle) * 10;
    this.speedY = Math.sin(this.angle) * 10;

    this.timer = 0;
    this.toRemove = false;
    this.pressingLeftMouseButton = false;

    BULLET_LIST[this.id] = this;
  }

  getDistance(x, y){ //ta funkcja dziala zle
    return Math.sqrt(Math.pow(this.x-x,2) + Math.pow(this.y-y,2));
  }

  superUpdate() {
    super.update();
  }

  bulletColision(){
    for (var i in PLAYER_LIST){
      var player = PLAYER_LIST[i];
      if(this.getDistance(PLAYER_LIST[i].x, PLAYER_LIST[i].y) < 35 && this.parent !== player.id){
        player.hp -= 1;
        var shooter = PLAYER_LIST[this.parent];
        if(player.hp <= 0){
          if(shooter){
            shooter.score += 1;
          }
          player.hp = 10;
          player.x = Math.random()*500;
          player.y = Math.random()*500;

        }
        this.toRemove = true;
      }
    }
  }

  update() {
    if (this.timer++ > 100)
      this.toRemove = true;
    this.superUpdate();
    this.bulletColision();

  }

  getInitPack(){
    var initPack = {
      id: this.id,
      x: this.x,
      y: this.y
    }
    return initPack;
  }

  getUpdatePack(){
    var deletePack = {
      id: this.id,
      x: this.x,
      y: this.y
    }
    return deletePack;
  }

  static getAllInitPacks(){
    var bullets = [];
    for (var i in BULLET_LIST){
      bullets.push(BULLET_LIST[i].getInitPack());
    }
    return bullets;
  }

  static shotBullet(x, y, socketId) {
    var bullet = new Bullet(x, y, socketId);
    initPack.bullet.push(bullet.getInitPack());
  }
  static updateBullet(){
    var pack = [];
    for (var i in BULLET_LIST) {
      var bullet = BULLET_LIST[i];
      bullet.update();
      if (bullet.toRemove){
        delete BULLET_LIST[i];
        deletePack.bullet.push(bullet.id);
      } else{
      pack.push(bullet.getUpdatePack());
    }
  }
    return pack;
  }


};


var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket) {
  socket.id = Math.random();
  SOCKET_LIST[socket.id] = socket;

  var USERS = {
    //username:password
    "bob": "123",
    "aaa": "aaa",
    "chuj": "chuj"
  }


  var isValidPassword = function(data, cb) {
    return cb(true);
    // db.account.find({username:data.username, password:data.password}, function(err, res){
    //   if (res.length > 0)
    //     cb(true);
    //   else
    //     cb(false);
    // });
  }

  var isUsernameTaken = function(data, cb) {
    return cb(false);
  //   db.account.find({username:data.username}, function(err, res){
  //     if (res.length > 0)
  //       cb(true);
  //     else
  //       cb(false);
  // });
}

  var addUser = function(data, cb) {
    return cb();
    // db.account.insert({username:data.username, password:data.password, function(err){
    //   cb();
    // }});

  }

  socket.on('signIn', function(data) {
    isValidPassword(data, function(res) { //tutaj res to tak jakby cb z definicji tej fcji
      if (res) {
        Player.onConnect(socket);
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

  socket.on('signUp', function(data) {
    isUsernameTaken(data, function(res){
      if (res){
        socket.emit("signUpResponse", {
          success: false
        });
      } else {
        addUser(data, function(){
          socket.emit("signUpResponse", {
            success: true
          });
        });
      }
    });
  });

  socket.on('disconnect', function() {
    Player.onDisconnect(socket);
  });

  socket.on("evalServer", function(data) {
    var res = eval(data); //eval means execute data
    socket.emit('evalAnswer', res);
  });

  socket.on('sendMsgToServer', function(data) {
    var playerName = ("" + socket.id).slice(2, 7);
    for (var i in SOCKET_LIST) {
      SOCKET_LIST[i].emit('addToChat', playerName + ": " + data);
    }
  });


});

var initPack = {id: null, player:[], bullet:[]};
var deletePack = {player:[], bullet:[]};

setInterval(function() {

  var pack = {
    player: Player.updatePlayer(),
    bullet: Bullet.updateBullet()
  }

  for (var i in SOCKET_LIST) {
    var socket = SOCKET_LIST[i];
    socket.emit('update', pack);
    socket.emit('init',initPack);
    socket.emit('delete', deletePack);
  }
  initPack.player = [];
  initPack.bullet = [];
  deletePack.player = [];
  deletePack.bullet = [];

}, 1000 / 25);

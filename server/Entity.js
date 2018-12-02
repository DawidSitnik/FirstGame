'use strict';

//pack which we send while adding a new player
let initPack = {
  id: null,
  player: [],
  bullet: [],
  bucket: [],
};

//pack which we send while deleting a player
let deletePack = {
  player: [],
  bullet: [],
  bucket: [],
};

//basic lists
let SOCKET_LIST = {};
let PLAYER_LIST = {};
let BULLET_LIST = {};
let BUCKET_LIST = {};

let WIDTH = 4000;
let HEIGHT = 4000;

//body size, changes its measurements while changing body size
let SCR_WIDTH = 0;
let SCR_HEIGHT = 0;

//total size of our screen
let TOTAL_SCR_WIDTH = 0;
let TOTAL_SCR_HEIGHT = 0;

let RADIUS = 48;

//Used for taking parameters from app.js (app.js takes them from index.html)
class Screen {
  constructor() {

  }
  static setSize(width, heigth, totalWidth, totalHeight) {
    SCR_WIDTH = width;
    SCR_HEIGHT = heigth;
    TOTAL_SCR_WIDTH = totalWidth;
    TOTAL_SCR_HEIGHT = totalHeight;
  }
}

//basic class which is a parent for Player and Bullet
class Entity {
  constructor(param) {
    this.x = Math.floor(2000 * Math.random() + 1000);
    this.y = Math.floor(2000 * Math.random() + 1000);
    this.speedX = 0;
    this.speedY = 0;
    this.id = "";
    this.map = "forest";

    if (param) {
      if (param.x)
        this.x = param.x;
      if (param.y)
        this.y = param.y;
      if (param.speedX)
        this.speedX = param.speedX;
      if (param.speedY)
        this.speedY = param.speedY;
      if (param.id)
        this.id = param.id;
      if (param.map) {
        this.map = param.map;
      }
    }
  }

  updatePosition() {
    if (this.x + this.speedX >= 3000 || this.x + this.speedX <= 1000) {
      this.x = this.x;
    } else {
      this.x += this.speedX;
    }
    if (this.y + this.speedY >= 3000 || this.y + this.speedY <= 1000) {
      this.y = this.y;
    } else {
      this.y += this.speedY;
    }
  }

  //update Entity
  update() {
    this.updatePosition();
  }

  //updating all packets
  static getFrameUpdateData() {
    let pack = {
      initPack: {
        player: initPack.player,
        bullet: initPack.bullet,
        bucket: initPack.bucket,
      },
      deletePack: {
        player: deletePack.player,
        bullet: deletePack.bullet,
        bucket: deletePack.bucket,
      },
      updatePack: {
        player: Player.updatePlayer(),
        bullet: Bullet.updateBullet(),
        bucket: Bucket.updateBucket(),
      }
    }

    initPack.player = [];
    initPack.bullet = [];
    initPack.bucket = [];
    deletePack.player = [];
    deletePack.bullet = [];
    deletePack.bucket = [];

    return pack;
  }

  //getting distance from entity and x,y
  getDistance(x, y) {
    return Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2));
  }
};

class Player extends Entity {
  constructor(param) {
    super(param);
    this.login = param.login;
    this.number = "" + Math.floor(10 * Math.random());
    this.pressingRight = false;
    this.pressingLeft = false;
    this.pressingUp = false;
    this.pressingDown = false;
    this.speed = 10;
    this.radius = RADIUS;
  }

  updateSpeed() {
    if (this.pressingRight == true)
      this.speedX = this.speed;
    else if (this.pressingLeft == true)
      this.speedX = -this.speed;
    else
      this.speedX = 0;

    if (this.pressingUp == true)
      this.speedY = -this.speed;
    else if (this.pressingDown == true)
      this.speedY = this.speed;
    else
      this.speedY = 0;
  }

  superUpdate() {
    super.update();
  }

  update() {
    this.superUpdate();
    this.updateSpeed();
    this.bucketColision();
    this.PlayerColision();
  }

  static updatePlayer() {
    let pack = [];
    for (let i in PLAYER_LIST) {
      let player = PLAYER_LIST[i];
      player.update();
      pack.push(player.getUpdatePack());
    }
    return pack;
  }

  getUpdatePack() {
    let updatePack = {
      id: this.id,
      x: this.x,
      y: this.y,
      map: this.map,
      radius: this.radius,
      speed: this.speed,
    };
    return updatePack;
  }

  getInitPack() {
    let initPack = {
      id: this.id,
      x: this.x,
      y: this.y,
      number: this.number,
      map: this.map,
      radius: this.radius,
      speed: this.speed,
      login: this.login,
    };

    return initPack;
  }


  PlayerColision() {
    for (let i in PLAYER_LIST) {
      let enemy = PLAYER_LIST[i];
      if (this.id != PLAYER_LIST[i].id) {
        if (super.getDistance(enemy.x - 2, enemy.y - 2) < this.radius) {
          if (enemy.radius < this.radius) {
            enemy.radius -= (this.radius / 100);
            if (enemy.radius <= RADIUS) {
              this.radius += 10;
              enemy.x=2000;
              enemy.y=2000;
            }
          }
        }
      }
    }
  }

  bucketColision() {
    for (let i in BUCKET_LIST) {
      let bucket = BUCKET_LIST[i];
      if (Math.abs(super.getDistance(bucket.x, bucket.y) - (this.radius)) <= 6) {
        this.radius += 1;
        if (this.speed >= 2)
          this.speed -= 0.02;
        bucket.toRemove = true;
      }
    }
  }

  static getAllInitPacks() {
    let players = [];
    for (let i in PLAYER_LIST) {
      players.push(PLAYER_LIST[i].getInitPack());
    }
    return players;
  }

  // used just if player is connected
  static onConnect(socket, login) {
    let map = 'field';
    if (Math.random() < 2)
      map = 'forest';

    let player = new Player({
      login: login,
      id: socket.id,
      map: map,
      socket: socket,
    });

    PLAYER_LIST[socket.id] = player;
    initPack.player.push(player.getInitPack());
    socket.on('keyPress', function(data) {
      if (data.inputId === 'left')
        player.pressingLeft = data.state;
      else if (data.inputId === 'right')
        player.pressingRight = data.state;
      else if (data.inputId === 'up')
        player.pressingUp = data.state;
      else if (data.inputId === 'down')
        player.pressingDown = data.state;
      else if (data.inputId === 'leftMouseButton') {
        Bullet.shotBullet(data.x, data.y, socket.id, map);
      }

    });

    socket.on('changeMap', function(data) {
      if (player.map === 'field') {
        player.map = 'forest';
        map = "forest";
      } else {
        player.map = 'field';
        map = "field";
      }
    });

    socket.on('sendMsgToServer', function(data) {

      for (let i in SOCKET_LIST) {
        SOCKET_LIST[i].emit('addToChat', login + ": " + data);
      }
    });

    socket.on('sendPrivateMsg', function(data) {
      let recipentSocket = null;
      for (let i in PLAYER_LIST) {
        if (PLAYER_LIST[i].login === data.toWho)
          recipentSocket = SOCKET_LIST[PLAYER_LIST[i].id];
      }
      if (recipentSocket === null)
        socket.emit('addToChat', 'User ' + data.toWho + " is offline.");
      else {
        recipentSocket.emit('addToChat', 'From  ' + player.login + ':' + data.message);
        socket.emit('addToChat', 'To  ' + data.toWho + ':' + data.message);
      }
    });

    socket.emit('init', {
      id: socket.id,
      player: Player.getAllInitPacks(),
      bullet: Bullet.getAllInitPacks(),
      bucket: Bucket.getAllInitPacks(),
    });
  }

  static onDisconnect(socket) {
    delete SOCKET_LIST[socket.id];
    delete PLAYER_LIST[socket.id];
    deletePack.player.push(socket.id);
  }

};

class Bucket {
  constructor() {
    this.id = Math.random();
    this.x = Math.floor(2000 * Math.random() + 1000);
    this.y = Math.floor(2000 * Math.random() + 1000);
    this.toRemove = false;
    BUCKET_LIST[this.id] = this;
  }

  getInitPack() {
    let initPack = {
      id: this.id,
      x: this.x,
      y: this.y,
    }
    return initPack;
  }

  static getAllInitPacks() {
    let buckets = [];
    for (let i in BUCKET_LIST) {
      buckets.push(BUCKET_LIST[i].getInitPack());
    }
    return buckets;
  }

  static updateBucket() {
    let pack = [];
    for (let i in BUCKET_LIST) {
      let bucket = BUCKET_LIST[i];
      if (bucket.toRemove) {
        delete BUCKET_LIST[i];
        deletePack.bucket.push(bucket.id);
      }
    }
    return pack;
  }

  static RespBuckets() {
    BUCKET_LIST = {};
    for (let i = 0; i < 100; i++) {
      new Bucket;
    }
  }
}

Bucket.RespBuckets();

class Bullet extends Entity {
  //strzelanie z nie dziala tak jak powinno bo przy zmianie wielkosci ekranu nie jest skalowane SCR_SIZE
  constructor(param) {
    super(param);
    this.parent = param.id;
    this.speed = 10;
    this.x = PLAYER_LIST[this.parent].x + 10;
    this.y = PLAYER_LIST[this.parent].y - 10;
    this.angle = Math.atan((param.y - TOTAL_SCR_HEIGHT / 2) / (param.x - TOTAL_SCR_WIDTH / 2));
    if ((param.x - TOTAL_SCR_WIDTH / 2) < 0)
      this.angle += Math.PI;
    this.id = Math.random();
    this.speedX = Math.cos(this.angle) * 20;
    this.speedY = Math.sin(this.angle) * 20;

    this.timer = 0;
    this.toRemove = false;
    this.pressingLeftMouseButton = false;

    BULLET_LIST[this.id] = this;
  }

  updatePosition() {
    if (this.x + this.speedX >= WIDTH / 2 + 1000 || this.x + this.speedX <= WIDTH / 2 - 1000) {
      this.toRemove = true;
    } else {
      this.x += this.speedX;
    }
    if (this.y + this.speedY >= WIDTH / 2 + 1000 || this.y + this.speedY <= WIDTH / 2 - 1000) {
      this.toRemove = true;
    } else {
      this.y += this.speedY;
    }
  }

  bulletColision() {
    for (let i in PLAYER_LIST) {
      let player = PLAYER_LIST[i];
      let shooter = PLAYER_LIST[this.parent];
      if (this.map === player.map && super.getDistance(player.x, player.y) < player.radius && this.parent !== player.id) {
        player.radius -= Math.floor((shooter.radius / 40));
        if (player.radius <= RADIUS) {
          if (shooter) {
            shooter.radius += 10;
            player.x=2000;
            player.y=2000;
          }
        }
        this.toRemove = true;
      }
    }
  }

  update() {
    if (this.timer++ > 100)
      this.toRemove = true;
    this.updatePosition();
    this.bulletColision();

  }

  getInitPack() {
    let initPack = {
      id: this.id,
      x: this.x,
      y: this.y,
      map: this.map,
    }
    return initPack;
  }

  getUpdatePack() {
    let deletePack = {
      id: this.id,
      x: this.x,
      y: this.y,
      map: this.map,
    }
    return deletePack;
  }

  static getAllInitPacks() {
    let bullets = [];
    for (let i in BULLET_LIST) {
      bullets.push(BULLET_LIST[i].getInitPack());
    }
    return bullets;
  }

  static shotBullet(x, y, socketId, map) {
    let bullet = new Bullet({
      x: x,
      y: y,
      id: socketId,
      map: map,
    });
    initPack.bullet.push(bullet.getInitPack());
  }

  static updateBullet() {
    let pack = [];
    for (let i in BULLET_LIST) {
      let bullet = BULLET_LIST[i];
      bullet.update();
      if (bullet.toRemove) {
        delete BULLET_LIST[i];
        deletePack.bullet.push(bullet.id);
      } else {
        pack.push(bullet.getUpdatePack());
      }
    }
    return pack;
  }
};

module.exports = {
  Entity: Entity,
  Player: Player,
  Bullet: Bullet,
  SOCKET_LIST: SOCKET_LIST,
  PLAYER_LIST: PLAYER_LIST,
  Screen: Screen,
}

'use strict';

    let Inventory = require("./client/js/Inventory.js");

    let socket = io();

    //signIn
    let gameDiv = document.getElementById('gameDiv');
    let signDiv = document.getElementById('signDiv');
    let signDivUsername = document.getElementById('signDiv-username');    let signDivSignIn = document.getElementById('signDiv-signIn');
    let signDivSignUp = document.getElementById('signDiv-signUp');
    let signDivPassword = document.getElementById('signDiv-password');


    signDivSignIn.onclick = function(){
      socket.emit("signIn", {username:signDivUsername.value, password:signDivPassword.value});
    }

    signDivSignUp.onclick = function(){
      socket.emit("signUp", {username:signDivUsername.value, password:signDivPassword.value});
    }

    socket.on('signUpResponse', function(data){
      if(data.success){
        alert("Sign up succesfull.");
      } else {
        alert("Sign up unsuccesfull.");
      }
    });

    socket.on('signInResponse', function(data){
      if(data.success){
        signDiv.style.display = 'none';
        gameDiv.style.display = 'inline-block';
      } else {
        alert("Sign in unsuccesfull.");
      }
    });



    //chat
    let chatText = document.getElementById('chat-text');
    let chatForm = document.getElementById('chat-form');
    let chatInput = document.getElementById('chat-input');

    socket.on('addToChat', function(data){
      chatText.innerHTML += '<div>' + data + '</div>';
    });

    socket.on('evalAnswer', function(data){
      console.log(data);
    })

    chatForm.onsubmit = function(e){
      e.preventDefault();
      if(chatInput.value[0] === '/')
        socket.emit('evalServer', chatInput.value.slice(1));
        if(chatInput.value[0] === '@'){
          let toWho = chatInput.value.slice(1, chatInput.value.indexOf(','));
          let message = chatInput.value.slice(chatInput.value.indexOf(',')+1);
          let data = {
            toWho: toWho,
            message: message
          }
          socket.emit('sendPrivateMsg', data);
        }

      else
        socket.emit('sendMsgToServer',chatInput.value);
      chatInput.value = '';
    }


    let inventory = new Inventory.Inventory(null);
    socket.on("updateInventory", function(items){
      inventory.items = items;
      inventory.refreshRender();
    });

    //game
    let WIDTH = 500;
    let HEIGHT = 500;

    let ctx = document.getElementById("ctx").getContext("2d");
    let ctxScore = document.getElementById("ctxScore").getContext("2d");
    ctxScore.font = '30px Arial';

    let Img = {};
    Img.player = new Image();
    Img.player.src = '/client/img/player.png';
    Img.bullet = new Image();
    Img.bullet.src = '/client/img/bullet.png';
    Img.map = {};
    Img.map['field'] = new Image();
    Img.map['field'].src = '/client/img/map2.png';
    Img.map['forest'] = new Image();
    Img.map['forest'].src = '/client/img/map.png';

    let PLAYER_LIST = {};
    let BULLET_LIST = {};

    class Player{
      constructor(initPack){
        this.id = initPack.id;
        this.x =initPack.x;
        this.y = initPack.y;
        this.number = initPack.number;
        this.hp = initPack.hp;
        this.maxHp = initPack.maxHp;
        this.score = initPack.score;
        this.map = initPack.map;
        PLAYER_LIST[this.id] = this;
      }

      draw(){
        if(PLAYER_LIST[thisId].map !== this.map)
          return;

        ctx.fillStyle = 'red';
        let hpWidth = 30* this.hp/this.maxHp;

        let x = this.x - PLAYER_LIST[thisId].x + WIDTH/2;
        let y = this.y - PLAYER_LIST[thisId].y + HEIGHT/2;

        ctx.fillRect(x - hpWidth/2, y - 40, hpWidth, 4);

        let width = Img.player.width *2;
        let height = Img.player.height *2;

        ctx.drawImage(Img.player, 0,0, Img.player.width, Img.player.height,
        x - width/2, y - height/2, width, height);

        // ctx.fillText(this.score, this.x, this.y -60);
      }

    };

    class Bullet{
      constructor(initPack){
        this.id = initPack.id;
        this.x =initPack.x;
        this.y = initPack.y;
        this.map = initPack.map;
        BULLET_LIST[this.id] = this;
      }

      draw(){
        if(PLAYER_LIST[thisId].map !== this.map)
          return;

        let width = Img.bullet.width /2;
        let height = Img.bullet.height /2;

        let x = this.x - PLAYER_LIST[thisId].x + WIDTH/2;
        let y = this.y - PLAYER_LIST[thisId].y + HEIGHT/2;

        ctx.drawImage(Img.bullet, 0,0, Img.bullet.width, Img.bullet.height,
        x - width/2, y-height/2, width, height);
      }
    };

let thisId = null;

socket.on('init', function(data){

 if(data.id && thisId === null){
   thisId = data.id;
 }
  for(let i = 0; i < data.player.length; i++)
    new Player(data.player[i]);
  for(let i = 0; i < data.bullet.length; i++)
    new Bullet(data.bullet[i]);
});


socket.on('update', function(data){
  for(let i =0; i < data.player.length; i++){
    let pack = data.player[i];
    let p = PLAYER_LIST[pack.id];
    if(p){
      if(pack.x !== undefined)
        p.x = pack.x;
      if(pack.y !== undefined)
        p.y = pack.y;
      if(pack.hp !== undefined)
        p.hp = pack.hp;
      if(pack.score !== undefined)
        p.score = pack.score;
      if(pack.map !== undefined)
        p.map = pack.map;

    }
  }
  for(let i =0; i < data.bullet.length; i++){
    let pack = data.bullet[i];
    let b = BULLET_LIST[pack.id];
    if(b){
      if(pack.x !== undefined)
        b.x = pack.x;
      if(pack.y !== undefined)
        b.y = pack.y;
    }
  }
});

socket.on('delete', function(data){

  for(let i = 0; i < data.player.length; i++)
    delete PLAYER_LIST[data.player[i]];
  for(let i = 0; i < data.bullet.length; i++)
    delete BULLET_LIST[data.bullet[i]];
});

let drawMap = function(){
  if(thisId){
    let player = PLAYER_LIST[thisId];
    let x = WIDTH/2 - player.x;
    let y = HEIGHT/2 - player.y;

    ctx.drawImage(Img.map[player.map], x, y);
  }

}

let drawScore = function(){
  if(!PLAYER_LIST[thisId]) return;
  if(PLAYER_LIST[thisId].score === lastScore){
    return;
  }
    ctxScore.clearRect(0, 0, 500, 500);
    lastScore = PLAYER_LIST[thisId].score;
    ctxScore.fillStyle = 'white';
    ctxScore.fillText(PLAYER_LIST[thisId].score, 50, 50);

}

let lastScore = null;

let ChangeMap = function(){
  socket.emit('changeMap');
}

setInterval(function(){
  ctx.clearRect(0, 0, 500, 500);
  drawMap();
  drawScore();
  for (let i in PLAYER_LIST)
    PLAYER_LIST[i].draw();
  for (let i in BULLET_LIST)
    BULLET_LIST[i].draw();
}, 40);


document.addEventListener("click", function(event){
  socket.emit('keyPress', {
    inputId: 'leftMouseButton',
    x: event.x,
    y: event.y
  });
})

document.onkeydown = function(event) {
  if (event.keyCode === 68) //d
    socket.emit('keyPress', {
      inputId: 'right',
      state: true
    });
  else if (event.keyCode === 83) //s
    socket.emit('keyPress', {
      inputId: 'down',
      state: true
    });
  else if (event.keyCode === 65) //a
    socket.emit('keyPress', {
      inputId: 'left',
      state: true
    });
  else if (event.keyCode === 87) // w
    socket.emit('keyPress', {
      inputId: 'up',
      state: true
    });

}
document.onkeyup = function(event) {
  if (event.keyCode === 68) //d
    socket.emit('keyPress', {
      inputId: 'right',
      state: false
    });
  else if (event.keyCode === 83) //s
    socket.emit('keyPress', {
      inputId: 'down',
      state: false
    });
  else if (event.keyCode === 65) //a
    socket.emit('keyPress', {
      inputId: 'left',
      state: false
    });
  else if (event.keyCode === 87) // w
    socket.emit('keyPress', {
      inputId: 'up',
      state: false
    });
}

document.oncontextmenu = function(event){
  event.preventDefault();
}

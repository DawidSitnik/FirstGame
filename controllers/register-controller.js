'use strict';
var connection = require('./../config');

class Registration{

  constructor(login, password){
    this.login = login;
    this.password = password;
  }

  register(){

      var users={
          "login": this.login,
          "password": this.password,
      }
      connection.query('INSERT INTO users SET ?',users)
      }
}

module.exports = Registration;

'use strict'
var connection = require('./../config');

class Authentication{

  constructor(login, password){
    this.login = login;
    this.password = password;

  }

  // let authenticate = function(data, cb){
  //
  //   var password = this.password;
  //     connection.query('SELECT * FROM users WHERE login = ?',[this.login], function (error, results, fields) {
  //       if (error) {
  //           console.log("There some error with controller");
  //           cb(false)
  //       }else{
  //         if(results.length >0){
  //             if(password==results[0].password){
  //                 console.log("successfully authenticated");
  //                 cb(true);
  //
  //             }else{
  //               console.log("Login and password does not match");
  //               cb(false);
  //             }
  //         }
  //         else{
  //           console.log("Login does not exist");
  //           cb(false);
  //         }
  //       }
  //     });
  //     }
}

module.exports = Authentication;

'use strict';

const USER_UPDATE_VALID_KEY = ['fullName', 'room', 'phone', 'gender', 'identityNumber'];

var User = require('../models').User;
var _ = require('lodash');
var ValidationError = require('sequelize').ValidationError;

exports.getCurrentUser = (req, res) => {
  let result = req.user.toJSON();
  req.user.getRoles().then(roles => {
    let roleNames = _.map(roles, r => r.name);
    if (roleNames.length > 0) result['roles'] = roleNames;
    res.json(result);
  });
};

exports.postSignOutAll = (req, res) => {
  req.user.signOutAll().then(() => {
    res.json({
      status: 200
    });
  });
};

exports.adminGetAll = (req, res) => {
  User.findAll().then(users => {
    
    let returnUser = _.map(users, u => {
      let retU = u.toJSON();
      delete retU.password;
      return retU;
    })
    res.json({
      users: returnUser
    });
  });
};

exports.putCurrentUser = (req, res) =>{
  USER_UPDATE_VALID_KEY.forEach(k => {
    req.sanitize(k).escape();
    req.sanitize(k).trim();
  });
  
  let updateInfo = _.pick(req.body, USER_UPDATE_VALID_KEY);
  
  if (updateInfo.phone){
    updateInfo.phone = updateInfo.phone.replace(/\D/g,''); // accept only numberic
  } 
 
  if (updateInfo.identityNumber){
    updateInfo.identityNumber = updateInfo.identityNumber.replace(/\D/g,'');
  }
  
  req.user.update(updateInfo).then(user => {
    res.json(user);
  }).catch(function(err) {
    if (err instanceof ValidationError){
      let errors = {};
      
      err.errors.forEach(err => {
        errors[err.path] = {
          message: err.message,
          message_code: `error.model.${_.snakeCase(err.message)}`
        };
      });
      
      res.status(422);
      res.json({
        status: 422,
        errors: errors   
      });
    } else {
      res.status(500);
      res.json({
        status: 500,
        error: err.message
      });
    }
  });
};

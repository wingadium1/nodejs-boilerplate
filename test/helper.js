'use strict';

var dotenv = require('dotenv');
dotenv.load({ path: `.env.${process.env.NODE_ENV || 'development'}` });

var Promise = require('bluebird');
var Sequelize = require('sequelize');
var models = require('../models');
var _sequelize = models.sequelize;
var assert = require('assert');
var faker = require('faker');
var Umzug = require('umzug');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var jwt = require('jsonwebtoken');
chai.use(chaiAsPromised);
var expect = chai.expect;
require('sinon');
require('sinon-as-promised');

before(done => {
  dbUtils.runMigrations()
    .then(dbUtils.clearDatabase)
    .then(() => done(), done);
});

after(() => {
  _sequelize.close();
});

var dbUtils = {
  runMigrations: () => {
    var umzug = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: _sequelize
      },
      migrations: {
        params: [_sequelize.getQueryInterface(), Sequelize],
        path: 'migrations'
      }
    });
    return umzug.up();
  },
  clearDatabase: () => {
    return Sequelize.Promise.each(
      Object.keys(models), function (modelName) {
        if (models[modelName] instanceof _sequelize.Model) {
          return models[modelName].destroy({
            where: Sequelize.literal('1=1'),
            truncate: true,
            cascade: true,
            force: true
          });
        }
      }
    );
  }
};

// Define factory
const createModel = (modelName, attrs) => {
  if (attrs == undefined) attrs = {};
  
  let Model = models[modelName];
  assert(Model, 'cannot get model of name ' + modelName + ' from app.models');
  
  return Model.create(attrs);
};

var createUser = (attrs) => {
  if (attrs == undefined) attrs = {};

  let password = attrs.password || faker.internet.password();
  return createModel('User', {
    fullName: attrs.fullname || faker.name.findName(),
    email: attrs.email || faker.internet.email(),
    password: password
  }).then(u => {
    u['__test__'] = {password: password}; // inject testing data into user object
    return Promise.resolve(u);
  });
};

const assignRoleToUser = (user, roleName) => {
  assert(user, 'user cannot be blank');
  assert(roleName, 'roleName cannot be blank');
  
  let Role = models.Role;
  return Role.findOrCreate({where: {name: roleName}}).then(role => {
    return user.addRole(role[0]);
  }).then(() => Promise.resolve(user));
};

const createUserWithRole = (attrs, roleName) => {
  let createdUser;
  
  return createUser(attrs).then(user => {
    createdUser = user;
    
    return assignRoleToUser(user, roleName);
  }).then(() => {
    return Promise.resolve(createdUser);
  });
};

var createAccessTokenForUserId = (userId) => {
  return jwt.sign({id: userId}, process.env.TOKEN_SECRET, {
    expiresIn: 60 * 24 * 60 * 60
  });
};

exports.createAccessTokenForUserId = createAccessTokenForUserId;
exports.dbUtils = dbUtils;
exports.factory = {
  createUser: createUser,
  assignRoleToUser: assignRoleToUser,
  createUserWithRole: createUserWithRole
};

// Setup some global helper
global.expect = expect;

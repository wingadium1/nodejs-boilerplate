'use strict';

const models = require('../models');

module.exports = {
  up: function (queryInterface, Sequelize) {
    var user, role;
    
    return models.User.create({
      email: 'admin@gmail.com',
      password: '12345678',
      fullName: 'admin'
    }).then(function(u) {
      user = u;
      return models.Role.create({
        name: 'admin'
      });
    }).then(function(r){
      role = r;
      return models.User.create({
        email: 'client@gmail.com',
        password: '12345678',
        fullName: 'client'
      });
    }).then(() =>{
      user.addRole(role);
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Users', {}).then(() => {
      return queryInterface.bulkDelete('Roles', {});
    });
  }
};

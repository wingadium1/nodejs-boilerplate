'use strict';

const helper = require('../helper');
const request = require('supertest');
const app = require('../../app.js');

describe('PUT /api/v1/users/me', () => {
  let user, accessToken;
  
  before(done => {
    helper.factory.createUser().then(u => {
      user = u;
      accessToken = helper.createAccessTokenForUserId(u.id);
      done();
    });
  });
  
  describe('with valid access token and ', () => {
    describe('valid input attribute', () => {
      it('should return 200 OK and return new user profile', done => {
        request(app)
          .put('/api/v1/users/me')
          .set('X-Access-Token', accessToken)
          .send({
            fullName: 'Nguyen Van A',
            room: 'D222',
            phone: '123123123123',
            gender: 'male',
            identityNumber: '123456789',
            password: '12345678',
            email: 'email@email'
          })
          .set('Content-Type', 'application/json')
          .expect(res => {
            expect(res.body.email).to.equal(user.email);
            expect(res.body.fullName).to.equal('Nguyen Van A');
            expect(res.body.id).to.equal(user.id);
            expect(res.body.room).to.equal('D222');
            expect(res.body.phone).to.equal('123123123123');
            expect(res.body.gender).to.equal('male');
            expect(res.body.identityNumber).to.equal('123456789');
          })
          .expect(200, done);  
      });
    }); 
    
    describe('invalid input attribute', () => {
      it('should return 422 and return errors in correct format', done => {
        request(app)
          .put('/api/v1/users/me')
          .set('X-Access-Token', accessToken)
          .send({
            identityNumber: '12345678',
            fullName: ''
          })
          .set('Content-Type', 'application/json')
          .expect(res => {
            expect(res.body.status).to.equal(422);
            expect(res.body.errors.identityNumber).to.be.ok;
            expect(res.body.errors.identityNumber.message_code).to.equal('error.model.validation_len_failed');
            expect(res.body.errors.fullName).to.be.ok;
            expect(res.body.errors.fullName.message_code).to.equal('error.model.validation_len_failed');
          })
          .expect(422, done);
      });
    });
  });
});

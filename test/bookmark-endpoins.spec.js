'use strict';
/*global request*/
const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { bookmarks} = require('../src/store');


describe('Bookmark Endpoints', function () {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean the table', () => db('bookmarks').truncate());

  afterEach('cleanup', () => db('bookmarks').truncate());

  describe('GET /bookmarks', () => {
    context('Given no bookmarks', () => {
      it('responds with 200 and an empty list', () => {
        return request(app)
          .get('/')
          .expect(200);
      });
    });
    context('Given there are bookmarks in the database', () => {
      const testArticles = bookmarks;

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testArticles);
      });

      it('responds with 401 Unauthorized for GET /bookmarks', () => {
        return require(app)
          .get('/bookmarks')
          .expect(401, { error: 'Unauthorized request' });
      });

      it('GET /bookmarks responds with 200 and all of the bookmarks', () => {
        return request(app)
          .get('/bookmarks')
          .expect(200, testArticles);
      });
    });
  });

  describe('GET /bookmarks/:article_id', () => {
    context('Given no bookmarks', () => {
      it('responds with 404', () => {
        const articleId = 123456;
        return request(app)
          .get(`/bookmarks/${articleId}`)
          .expect(404, { error: { message: 'Article doesn\'t exist' } });
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testArticles = bookmarks;

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testArticles);
      });
      it('GET /article/:article_id responds with 200 and the specified article', () => {
        const articleId = 2;
        const expectedArticle = testArticles[articleId - 1];
        return request(app)
          .get(`/bookmarks/${articleId}`)
          .expect(200, expectedArticle);
      });
    });
  });
});
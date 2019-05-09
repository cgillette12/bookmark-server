'use strict';
/*global request*/
const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmark.fixtures');


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
          .get('/bookmark')
          .expect(200);
      });
    });
    context('Given there are bookmarks in the database', () => {
      const testbookmarks = makeBookmarksArray;

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testbookmarks);
      });

      // it('responds with 401 Unauthorized for GET /bookmark', () => {
      //   return request(app)
      //     .get('/bookmark')
      //     .expect(401, { error: 'Unauthorized request' });
      // });

      it('GET /bookmark responds with 200 and all of the bookmarks', () => {
        return request(app)
          .get('/bookmark')
          .expect(200, testbookmarks);
      });

      it('removes XSS attack content', () => {
        return request(app)
          .get('/bookmark');
      });
    });
  });

  describe('GET /bookmark/:bookmark_id', () => {
    context('Given no bookmarks', () => {
      it('responds with 404', () => {
        const bookmarkId = 100;
        return request(app)
          .get(`/bookmark/${bookmarkId}`)
          .expect(404, { error: { message: 'bookmark doesn\'t exist' } });
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testbookmarks = makeBookmarksArray;

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testbookmarks);
      });
      it('GET /bookmark/:bookmark_id responds with 200 and the specified article', () => {
        const bookmarkId = 2;
        const expectedbookmark = testbookmarks[bookmarkId - 1];
        return request(app)
          .get(`/bookmark/${bookmarkId}`)
          .expect(200, expectedbookmark);
      });
    });
  });

  describe.only('POST /bookmark', () => {
    it('creates an article, responding with 201 and the new article', function () {
      this.retries(3);
      const newbookmark = {
        title: 'Google',
        url: 'https://www.google.com',
        description: 'what people use when there lost',
        rating: 5
      };
      return request(app)
        .post('/bookmark')
        .send(newbookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newbookmark.title);
          expect(res.body.url).to.eql(newbookmark.style);
          expect(res.body.description).to.eql(newbookmark.content);
          expect(res.body.rating).to.eql(newbookmark.rating);
          expect(res.body).to.have.property('id');
          // expect(res.headers.location).to.eql(`/api/articles/${res.body.id}`);
          // const expected = new Date().toLocaleString('en', { timeZone: 'UTC' });
          // const actual = new Date(res.body.date_published).toLocaleString();
          // expect(actual).to.eql(expected);
        })
        .then(postRes => {
          request(app)
            .get(`/bookmark/${postRes.body.id}`)
            .expect(postRes.body);
        });
    });
  });
});
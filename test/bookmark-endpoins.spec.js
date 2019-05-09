const knex = require('knex')
const fixtures = require('./bookmark-fixtures')
const app = require('../src/app')

describe('Bookmarks Endpoints', () => {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => db('bookmarks').truncate())

  afterEach('cleanup', () => db('bookmarks').truncate())

  describe(`Unauthorized requests`, () => {
    const testBookmarks = fixtures.makeBookmarksArray

    beforeEach('insert bookmarks', () => {
      return db
        .into('bookmarks')
        .insert(testBookmarks)
    })

    it(`responds with 401 Unauthorized for GET /bookmark`, () => {
      return request(app)
        .get('/bookmark')
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for POST /bookmark`, () => {
      return request(app)
        .post('/bookmark')
        .send({ title: 'test-title', url: 'http://some.thing.com', rating: 1 })
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for GET /bookmark/:id`, () => {
      const secondBookmark = testBookmarks[1]
      return request(app)
        .get(`/bookmark/${secondBookmark.id}`)
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for DELETE /bookmark/:id`, () => {
      const aBookmark = testBookmarks[1]
      return request(app)
        .delete(`/bookmark/${aBookmark.id}`)
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for PATCH /bookmark/:id`, () => {
      const aBookmark = testBookmarks[1]
      return request(app)
        .patch(`/bookmark/${aBookmark.id}`)
        .send({ title: 'updated-title' })
        .expect(401, { error: 'Unauthorized request' })
    })
  })

  describe('GET /bookmark', () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 200 and an empty list`, () => {
        return request(app)
          .get('/bookmark')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [])
      })
    })

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = fixtures.makeBookmarksArray

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('gets the bookmarks from the store', () => {
        return request(app)
          .get('/bookmark')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testBookmarks)
      })
    })

    context(`Given an XSS attack bookmark`, () => {
      const { maliciousBookmark, expectedBookmark } = fixtures.makeMaliciousBookmark

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([maliciousBookmark])
      })
    })
  })

  describe('GET /bookmark/:id', () => {
    context(`Given no bookmarks`, () => {
      it(`responds 404 whe bookmark doesn't exist`, () => {
        return request(app)
          .get(`/bookmark/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `bookmark doesn't exist` }
          })
      })
    })

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = fixtures.makeBookmarksArray

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('responds with 200 and the specified bookmark', () => {
        const bookmarkId = 2
        const expectedBookmark = testBookmarks[bookmarkId - 1]
        return request(app)
          .get(`/bookmark/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBookmark)
      })
    })
  })

  describe('DELETE /bookmark/:id', () => {
    context(`Given no bookmarks`, () => {
      it(`responds 404 whe bookmark doesn't exist`, () => {
        return request(app)
          .delete(`/bookmark/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `bookmark doesn't exist` }
          })
      })
    })

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = fixtures.makeBookmarksArray

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('removes the bookmark by ID from the store', () => {
        const idToRemove = 2
        const expectedBookmarks = testBookmarks.filter(bm => bm.id !== idToRemove)
        return request(app)
          .delete(`/bookmark/${idToRemove}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(() =>
            request(app)
              .get(`/bookmark`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedBookmarks)
          )
      })
    })
  })

  describe('POST /bookmark', () => {
    ['title', 'url', 'rating'].forEach(field => {
      const newBookmark = {
        title: 'test-title',
        url: 'https://test.com',
        rating: 2,
      }

      it(`responds with 400 missing '${field}' if not supplied`, () => {
        delete newBookmark[field]

        return request(app)
          .post(`/bookmark`)
          .send(newBookmark)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: { message: `'${field}' is required` }
          })
      })
    })

    it(`responds with 400 invalid 'rating' if not between 0 and 5`, () => {
      const newBookmarkInvalidRating = {
        title: 'test-title',
        url: 'https://test.com',
        rating: 'invalid',
      }
      return request(app)
        .post(`/bookmark`)
        .send(newBookmarkInvalidRating)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: { message: `'rating' must be a number between 0 and 5` }
        })
    })

    // it(`responds with 400 invalid 'url' if not a valid URL`, () => {
    //   const newBookmarkInvalidUrl = {
    //     title: 'test-title',
    //     url: 'htp://invalid-url',
    //     rating: 1,
    //   }
    //   return request(app)
    //     .post(`/bookmark`)
    //     .send(newBookmarkInvalidUrl)
    //     .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
    //     .expect(400, {
    //       error: { message: `'url' must be a valid URL` }
    //     })
    // })

    it('adds a new bookmark to the store', () => {
      const newBookmark = {
        title: 'test-title',
        url: 'https://test.com',
        description: 'test description',
        rating: 1,
      }
      return request(app)
        .post(`/bookmark`)
        .send(newBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title)
          expect(res.body.url).to.eql(newBookmark.url)
          expect(res.body.description).to.eql(newBookmark.description)
          expect(res.body.rating).to.eql(newBookmark.rating)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/bookmark/${res.body.id}`)
        })
        .then(res =>
          request(app)
            .get(`/bookmark/${res.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(res.body)
        )
    })
  })

  describe(`PATCH /bookmark/:bookmark_id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456
        return request(app)
          .patch(`/bookmark/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `bookmark doesn't exist` } })
      })
    })

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = fixtures.makeBookmarksArray

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('responds with 204 and updates the bookmark', () => {
        const idToUpdate = 2
        const updateBookmark = {
          title: 'updated bookmark title',
          url: 'https://updated-url.com',
          description: 'updated bookmark description',
          rating: 1,
        }
        const expectedArticle = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
        }
        return request(app)
          .patch(`/bookmark/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(updateBookmark)
          .expect(204)
          .then(res =>
            request(app)
              .get(`/bookmark/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedArticle)
          )
      })

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2
        return request(app)
          .patch(`/bookmark/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must content either 'title', 'url', 'description' or 'rating'`
            }
          })
      })

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2
        const updateBookmark = {
          title: 'updated bookmark title',
        }
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
        }

        return request(app)
          .patch(`/bookmark/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send({
            ...updateBookmark,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
          .then(res =>
            request(app)
              .get(`/bookmark/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedBookmark)
          )
      })

      it(`responds with 400 invalid 'rating' if not between 0 and 5`, () => {
        const idToUpdate = 2
        const updateInvalidRating = {
          rating: 'invalid',
        }
        return request(app)
          .patch(`/bookmark/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(updateInvalidRating)
          .expect(400, {
            error: {
              message: `'rating' must be a number between 0 and 5`
            }
          })
      })

      it(`responds with 400 invalid 'url' if not a valid URL`, () => {
        const idToUpdate = 2
        const updateInvalidUrl = {
          url: 'htp://invalid-url',
        }
        return request(app)
          .patch(`/bookmark/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(updateInvalidUrl)
          .expect(400, {
            error: {
              message: `'url' must be a valid URL`
            }
          })
      })
    })
  })
})
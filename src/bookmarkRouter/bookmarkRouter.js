'use strict';
const express = require('express');
const uuid = require('uuid/v4');
const xss = require('xss');
const logger = require('../logger');
const BookmarksService = require('./bookmark-service');

const bookmarksRouter = express.Router();
const bodyParser = express.json();

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: bookmark.rating,
});

bookmarksRouter
  .route('/bookmarks')
  .get((req, res,next) => {
    BookmarksService.getAllBookmarks(req.app.get('db'))
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmark));
      })
      .catch(next);
  })

  .post(bodyParser, (req, res) => {
    console.log(req.body);
    for (const field of ['title', 'url', 'rating']) {
      if (!req.body[field]) {
        logger.error(`${field} is required`);
        return res.status(400).send(`'${field}' is required`);
      }
    }
    const { title, url, description, rating } = req.body;

    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      logger.error(`Invalid rating '${rating}' supplied`);
      return res.status(400).send('\'rating\' must be a number between 0 and 5');
    }

   
    const bookmark = { id: uuid(), title, url, description, rating };

    BookmarksService.insertBookmark(req.app.get('db'),bookmark)
      .then(bookmark => {
        logger.info(`Bookmark with id ${bookmark.id} created`);
        res
          .status(201)
          .location(`http://localhost:8000/bookmarks/${bookmark.id}`)
          .json(bookmark);
      });
  });

bookmarksRouter
  .route('/bookmarks/:bookmark_id')
  .get((req, res, next) => {
    const { bookmark_id } = req.params;

    BookmarksService.getById(req.app.get('db'),bookmark_id)
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${bookmark_id} not found.`);
          return res
            .status(404)
            .send({
              error:{ 
                message: 'Article doesn\'t exist'
              }
            });
        }
        res.json(bookmark);
      })
      .catch(next);
  })
  .delete((req, res,next) => {
    const { bookmark_id } = req.params;

    BookmarksService.deleteBookmark(req.app.get('db'),bookmark_id)
      .then(bookmarkaffected => {
        logger.info(`Bookmark with id ${bookmark_id} deleted.`);
        res
          .status(204)
          .end();
      })
      .catch(next);
  });
    
module.exports = bookmarksRouter;
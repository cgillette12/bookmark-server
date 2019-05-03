'use strict';
const uuid = require('uuid/v4');

const bookmarks = [
  {
    id: uuid(),
    title: 'Thinkful',
    url: 'https://www.thinkful.com',
    description: 'Programming school',
    rating: 5
  },
  {
    id: uuid(),
    title: 'Google',
    url: 'https://www.google.com',
    description: 'what people use when there lost',
    rating: 5
  },
  {
    id: uuid(),
    title: 'Myspace',
    url: 'https://www.myspace.com',
    description: 'The place that used to exsist',
    rating: 1
  },
];

module.exports = { bookmarks };
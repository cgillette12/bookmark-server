'use strict';
const uuid = require('uuid/v4');

const bookmarks = [
  {
    id: 1,
    title: 'Thinkful',
    url: 'https://www.thinkful.com',
    description: 'Programming school',
    rating: 5
  },
  {
    id: 2,
    title: 'Google',
    url: 'https://www.google.com',
    description: 'what people use when there lost',
    rating: 5
  },
  {
    id: 3,
    title: 'Myspace',
    url: 'https://www.myspace.com',
    description: 'The place that used to exsist',
    rating: 1
  },
];

module.exports = { bookmarks };
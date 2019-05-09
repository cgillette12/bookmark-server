'use strict';

const makeBookmarksArray = [
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

function makeMaliciousBookmark() {
    const maliciousBookmark = {
        id: 911,
        style: 'How-to',
        date_published: new Date().toISOString(),
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
    }
    const expectedBookmark = {
        ...maliciousBookmark,
        title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    }
    return {
        maliciousBookmark,
        expectedBookmark,
    }
}

module.exports = { makeBookmarksArray, makeMaliciousBookmark};
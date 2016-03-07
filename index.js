var lunr = require('lunr');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');

// Create search index
var searchIndex = lunr(function () {
    this.ref('url');

    this.field('title', { boost: 10 });
    this.field('body');
});

var searchIndexEnabled = true;
var indexSize = 0;

module.exports = {
    book: {
        assets: './assets',
        js: [
            'lunr.min.js', 'search.js'
        ],
        css: [
            'search.css'
        ]
    },

    hooks: {
        // Index each page
        "page": function(page) {
            if (this.output.name != 'website' || !searchIndexEnabled) return page;

            var text, maxIndexSize;
            maxIndexSize = this.config.get('pluginsConfig.search.maxIndexSize') || this.config.get('search.maxIndexSize');

            this.log.debug.ln('index page', page.path);

            // Transform as TEXT
            text = page.content.replace(/(<([^>]+)>)/ig, '');

            indexSize = indexSize + text.length;
            if (indexSize > maxIndexSize) {
                this.log.warn.ln("search index is too big, indexing is now disabled");
                searchIndexEnabled = false;
                return page;
            }

            // Add to index
            searchIndex.add({
                url: this.output.toURL(page.path),
                title: page.title,
                body: text
            });

            return page;
        },

        // Write index to disk
        "finish": function() {
            if (this.output.name != 'website') return;

            this.log.debug.ln('write search index');
            return this.output.writeFile('search_index.json', JSON.stringify(searchIndex));
        }
    }
};


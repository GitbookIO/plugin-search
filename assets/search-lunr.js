require([
    'gitbook',
    'jquery'
], function(gitbook, $) {
    // Define global search engine
    function LunrSearchEngine() {
        this.index = null;
        this.name = 'LunrSearchEngine';
    }

    // Initialize lunr by fetching the search index
    LunrSearchEngine.prototype.init = function() {
        var that = this;
        var d = $.Deferred();

        $.getJSON(gitbook.state.basePath+'/search_index.json')
        .then(function(data) {
            // eslint-disable-next-line no-undef
            that.index = lunr.Index.load(data);
            d.resolve();
        });

        return d.promise();
    };

    // Search for a term and return results
    LunrSearchEngine.prototype.search = function(q) {
        if (!this.index) {
            return $.Deferred().resolve([]).promise();
        }

        var results = $.map(this.index.search(q), function(result) {
            var parts = result.ref.split('#');
            return {
                path: parts[0],
                hash: parts[1]
            };
        });

        return $.Deferred().resolve(results).promise();
    };

    // Set gitbook research
    gitbook.events.bind('start', function(e, config) {
        var engine = gitbook.search.getEngine();
        if (!engine) {
            gitbook.search.setEngine(LunrSearchEngine, config);
        }
    });
});
require([
    'gitbook',
    'jquery'
], function(gitbook, $) {
    var $body = $('body');
    var $bookSearchResults;
    var $searchInput;
    var $searchList;
    var $searchTitle;
    var $searchResultsCount;
    var $searchQuery;

    // Throttle search
    function throttle(fn, wait) {
        var timeout;

        return function() {
            var ctx = this, args = arguments;
            if (!timeout) {
                timeout = setTimeout(function() {
                    timeout = null;
                    fn.apply(ctx, args);
                }, wait);
            }
        };
    }

    // Return true if search is open
    function isSearchOpen() {
        return $body.hasClass('with-search');
    }

    // Toggle the search
    function toggleSearch(_state) {
        if (isSearchOpen() === _state) return;

        $body.toggleClass('with-search', _state);

        // If search bar is open: focus input
        if (isSearchOpen()) {
            gitbook.sidebar.toggle(true);
            $searchInput.focus();
        } else {
            $searchInput.blur();
            $searchInput.val('');
            $bookSearchResults.removeClass('open');
        }
    }

    function displayResults(res) {
        $bookSearchResults.addClass('open');

        // Clear old results
        $searchList.empty();

        // Display title for research
        $searchResultsCount.text(res.count);
        $searchQuery.text(res.query);

        // Create an <li> element for each result
        res.results.forEach(function(res) {
            var $li = $('<li>', {
                'class': 'search-results-item'
            });

            var $title = $('<h3>');

            var $link = $('<a>', {
                'href': gitbook.state.root+res.url,
                'text': res.title
            });

            var content = res.body;
            if (content.length > 500) {
                content = content.slice(0, 500)+'...';
            }
            var $content = $('<p>').html(content);

            $link.appendTo($title);
            $title.appendTo($li);
            $content.appendTo($li);
            $li.appendTo($searchList);
        });
    }

    function bindSearch() {
        // Bind DOM
        $searchInput        = $('#book-search-input');
        $bookSearchResults  = $('#book-search-results');
        $searchList         = $bookSearchResults.find('.search-results-list');
        $searchTitle        = $bookSearchResults.find('.search-results-title');
        $searchResultsCount = $searchTitle.find('.search-results-count');
        $searchQuery        = $searchTitle.find('.search-query');

        // Type in search bar
        $(document).on('keyup', '#book-search-input', function(e) {
            var key = (e.keyCode ? e.keyCode : e.which);
            var q = $(this).val();

            if (key == 27) {
                e.preventDefault();
                toggleSearch(false);
                return;
            }
            if (q.length == 0) {
                $bookSearchResults.removeClass('open');
            }
            else {
                throttle(gitbook.search.query(q)
                .then(function(results) {
                    displayResults(results);
                }), 1500);
            }
        });

        // Close search
        toggleSearch(false);
    }

    gitbook.events.bind('start', function() {
        // Create the toggle search button
        if (gitbook.toolbar) {
            gitbook.toolbar.createButton({
                icon: 'fa fa-search',
                label: 'Search',
                position: 'left',
                onClick: toggleSearch
            });
        }

        // Bind keyboard to toggle search
        if (gitbook.keyboard) {
            gitbook.keyboard.bind(['f'], toggleSearch);
        }
    });

    gitbook.events.bind('page.change', bindSearch);
});



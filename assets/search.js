require([
    'gitbook',
    'jquery'
], function(gitbook, $) {
    var $bookSearchResults;
    var $searchInput;
    var $searchList;
    var $searchTitle;

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

    // Update search input
    function updateInput(value) {
        $searchInput.val(value);
    }

    // Return true if search is open
    function isSearchOpen() {
        return $bookSearchResults.hasClass('open');
    }

    // Toggle the search
    function toggleSearch(_state) {
        if (isSearchOpen() === _state) return;

        $bookSearchResults.toggleClass('open', _state);

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

    function displayResults(results) {
        $bookSearchResults.addClass('open');

        // Clear old results
        $searchList.empty();

        // Display title for research
        $searchTitle.text('Search results for '+gitbook.storage.get('keyword', ''));

        // Create an <li> element for each result
        results.hits.forEach(function(res) {
            var $li = $('<li>', {
                'class': 'search-results-item'
            });

            var $title = $('<h3>');

            var $link = $('<a>', {
                'href': res.url,
                'text': res.title || res.url
            });

            var content = res.body? res.body.slice(0, 350)+'...' : '';
            var $content = $('<p>').html(content);

            $link.appendTo($title);
            $title.appendTo($li);
            $content.appendTo($li);
            $li.appendTo($searchList);
        });
    }

    // Recover current search when page changed
    function recoverSearch() {
        var keyword = gitbook.storage.get('keyword', '');

        updateInput(keyword);

        if (keyword.length > 0) {
            if(!isSearchOpen()) {
                toggleSearch();
            }

            gitbook.search.query(keyword)
            .then(function(results) {
                displayResults(results);
            });
        }
    }

    gitbook.events.bind('start', function(e, config) {
        // Bind DOM
        $bookSearchResults = gitbook.state.$book.find('div.book-search-results');
        $searchInput       = gitbook.state.$book.find('input[name="search-input"]');
        $searchList        = gitbook.state.$book.find('ul.search-results-list');
        $searchTitle       = gitbook.state.$book.find('h1.search-results-title');

        // Create the form
        updateInput();

        // Type in search bar
        $(document).on('keyup', '.book-search input', function(e) {
            var key = (e.keyCode ? e.keyCode : e.which);
            var q = $(this).val();

            if (key == 27) {
                e.preventDefault();
                gitbook.storage.remove('keyword');
                toggleSearch(false);
                return;
            }
            if (q.length == 0) {
                gitbook.storage.remove('keyword');
                $bookSearchResults.removeClass('open');
            } else {
                throttle(gitbook.research.query(q)
                .then(function(results) {
                    gitbook.storage.set('keyword', q);
                    displayResults(results);
                }), 1000);
            }
        });

        // Create the toggle search button
        gitbook.toolbar.createButton({
            icon: 'fa fa-search',
            label: 'Search',
            position: 'left',
            onClick: toggleSearch
        });

        // Bind keyboard to toggle search
        gitbook.keyboard.bind(['f'], toggleSearch);
    });

    gitbook.events.bind('page.change', recoverSearch);
});



require([
    'gitbook',
    'jquery'
], function(gitbook, $) {
    var MAX_RESULTS = 15;
    var MAX_DESCRIPTION_SIZE = 500;

    var usePushState = (typeof history.pushState !== 'undefined');

    // DOM Elements
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
            if (gitbook.sidebar) {
                gitbook.sidebar.toggle(true);
            }
            $searchInput.focus();
        } else {
            $searchInput.blur();
            $searchInput.val('');
            $bookSearchResults.removeClass('open');
        }
    }

    function displayResults(res) {
        $bookSearchResults.addClass('open');

        var noResults = res.count == 0;
        $bookSearchResults.toggleClass('no-results', noResults);

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

            var content = res.body.trim();
            if (content.length > MAX_DESCRIPTION_SIZE) {
                content = content.slice(0, MAX_DESCRIPTION_SIZE).trim()+'...';
            }
            var $content = $('<p>').html(content);

            $link.appendTo($title);
            $title.appendTo($li);
            $content.appendTo($li);
            $li.appendTo($searchList);
        });
    }

    function launchSearch(q) {
        // Launch search query
        throttle(gitbook.search.query(q, 0, MAX_RESULTS)
        .then(function(results) {
            displayResults(results);
        }), 1500);
    }

    function launchSearchFromQueryString() {
        var q = getParameterByName('q');
        if (q && q.length > 0) {
            // Toggle search
            toggleSearch(true);
            // Update search input
            $searchInput.val(q);
            // Launch search
            launchSearch(q);
        }
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
        $('#book-search-input').on('keyup', function(e) {
            var key = (e.keyCode ? e.keyCode : e.which);
            var q = $(this).val();

            // Update history state
            if (usePushState) {
                var uri = updateQueryString('q', q);
                history.pushState({ path: uri }, null, uri);
            }

            if (key == 27) {
                e.preventDefault();
                toggleSearch(false);
                return;
            }
            if (q.length == 0) {
                $bookSearchResults.removeClass('open');
            }
            else {
                launchSearch(q);
            }
        });
    }

    gitbook.events.on('start', function() {
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

    gitbook.events.on('page.change', function() {
        bindSearch();

        // Launch search based on query parameter
        if (gitbook.search.isInitialized) {
            launchSearchFromQueryString();
        }
    });

    gitbook.events.on('search.ready', function() {
        // Launch search from query param at start
        launchSearchFromQueryString();
    });

    function getParameterByName(name) {
        var url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)', 'i'),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    function updateQueryString(key, value) {
        value = encodeURIComponent(value);

        var url = window.location.href;
        var re = new RegExp('([?&])' + key + '=.*?(&|#|$)(.*)', 'gi'),
            hash;

        if (re.test(url)) {
            if (typeof value !== 'undefined' && value !== null)
                return url.replace(re, '$1' + key + '=' + value + '$2$3');
            else {
                hash = url.split('#');
                url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '');
                if (typeof hash[1] !== 'undefined' && hash[1] !== null)
                    url += '#' + hash[1];
                return url;
            }
        }
        else {
            if (typeof value !== 'undefined' && value !== null) {
                var separator = url.indexOf('?') !== -1 ? '&' : '?';
                hash = url.split('#');
                url = hash[0] + separator + key + '=' + value;
                if (typeof hash[1] !== 'undefined' && hash[1] !== null)
                    url += '#' + hash[1];
                return url;
            }
            else
                return url;
        }
    }
});



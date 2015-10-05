require(["gitbook"], function(gitbook) {
    gitbook.events.bind("start", function(config) {

        // Create the toggle search button
        gitbook.toolbar.createButton({
            icon: 'fa fa-search',
            label: 'Search',
            position: 'left',
            onClick: function() {

            }
        });
    });
});



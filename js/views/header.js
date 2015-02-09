window.HeaderView = window.View.extend({

    initialize: function () {
    },

    render: function () {
        $(this.el).html(this.template( { user: this.currentUser() } ));
        return this;
    },

    events: {
        "click .log-out": "logOut",
    },

    search: function () {
        var key = $('#searchText').val();
        console.log('search ' + key);
        this.searchResults.findByName(key);
        setTimeout(function () {
            $('.dropdown').addClass('open');
        });
    },

    onkeypress: function (event) {
        if (event.keyCode == 13) {
            event.preventDefault();
        }
    },

    select: function(menuItem) {
        $('.nav li').removeClass('active');
        $('.' + menuItem).addClass('active');
    }

});
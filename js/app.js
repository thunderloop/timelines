window.Router = Parse.Router.extend({
    routes: {
        "": "home",
        "timelines": "timelines",
        "timelines/:id": "events",
        "timeline/:id": "timeline",
        "events": "events",
    },
    
    initialize: function () {
        application.views['login'] = new LoginView();
        application.showView('#header', new HeaderView());
        //$('#header').html(application.headerView.render().el);
    },
    
    home: function() {
        application.showView('#content', new HomeView());
    },
    
    timelines: function() {
        application.showView('#content', new TimelineListView());
    },
    
    events: function(id) {
        application.showView('#content', new EventListView({ parentId: id }));
    },

    timeline: function(id) {
        application.showView('#content', new TimelineView({ parentId: id }));
    },

});


$(document).ready(function(){
    application.loadTemplates(["HomeView", "LoginView", "HeaderView", "ListView", "ListItemView", "ListFooterView", "EventListView", "EventListItemView", "TimelineView", "TimelineItemView" ],
        function () {
            Parse.$ = jQuery;
            // Initialize Parse with your Parse application javascript keys
            Parse.initialize("wGYAykVsrK8WH2lVOzl7onsve70NXTRPLUiiubJt",
                "pmDe3AVfHIaMqYvHhLpfOtTCnpuqjJFy0D9Qsuok");
            app = new Router();
            Parse.history.start();
        });
});

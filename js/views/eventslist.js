window.EventListView = window.ListView.extend({

    collection: "EventList",
    parentKey: "timelineId",
    parentClass: "Timeline",
    
    initialize: function(arguments) {
            _.extend(this, _.pick(arguments, "parentId"));
            ListView.prototype.initialize.apply(this, arguments);
    },
});


window.EventListItemView = window.ListItemView.extend({

});

/*
 * Note that you don't need to create a class on Parse, it will be autocreated.
 * To autocreate attributes add them to this.items.create() in the list view, not to defaults.
 * The attributes are only autocreated when the first object is added, not on subsequent writes.
 */

window.Timeline = Parse.Object.extend("Timeline", {

    defaults: {
        content: "empty item...",
        hidden: false,
    },

    initialize: function() {
        if (!this.get("name")) {
            this.set({ "name": this.defaults.name });
        }
    },
    // Toggle the `hidden` state of this item.
    toggle: function() {
        this.save({ hidden: !this.get("hidden") });
    }
});

window.TimelineList = Parse.Collection.extend({

    model: Timeline,

    // Filter down the list of all items that are hidden.
    hidden: function() {
        return this.filter(function(item) {
            return item.get('hidden');
        });
    },

    // Filter down the list to only items that are not hidden.
    remaining: function() {
        return this.without.apply(this, this.hidden());
    },
    
    // Generates the next order number for new items.
    nextOrder: function() {
        if (!this.length) return 1;
        return this.last().get('order') + 1;
    },
    
    // Objects are sorted by their original insertion order.
    comparator: function(item) {
        return item.get('order');
    }
});

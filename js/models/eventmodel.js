/*
 * Note that you don't need to create a class on Parse, it will be autocreated.
 * To autocreate attributes add them to this.items.create() in the list view, not to defaults.
 * The attributes are only autocreated when the first object is added, not on subsequent writes.
 */

window.Event = application.Object.extend("Event", {

    defaults: {
        name: "empty item...",
        date: "2015-01-31",
        year: "2015",
        month: "January",
        day: "31",
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
    },
    
    onSave: function(attribute, object) {
        if (attribute == "date") {
            var date = object[attribute];
            var result = date.match("^([0-9]{4})-([0-9]{2})-([0-9]{2})");
            object['year'] = result[1];
            object['month'] = this.getMonthName(parseInt(result[2]));
            object['day'] = result[3];
        }
        return object;
    },

    getMonthName: function(month) {
        var month_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return month_names[month-1];
    },
    
});

window.EventList = application.Collection.extend({

    model: Event,

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
        return item.get('date');
    }
});



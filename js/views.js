var application = {
    
    views: {},
    models: {},

    // Asynchronously load templates located in separate .html files
    loadTemplates: function(views, callback) {
        var deferreds = [];
        $.each(views, function(index, view) {
            if (window[view]) {
                deferreds.push($.get('tpl/' + view + '.html', function(data) {
                    window[view].prototype.template = _.template(data);
                }, 'html'));
            } else {
                alert(view + " not found, check that both the view class and the template file exist");
            }
        });
        $.when.apply(null, deferreds).done(callback);
    },
        
    showView: function(selector, view) {
        if (this.views[selector]) {
            this.views[selector].remove();
            this.views[selector].undelegateEvents();
        }
        
        if (view.requireLogin && view.loggedIn()==false) {
            $(selector).html(this.views['login'].render().el);
        } else {
            $(selector).html(view.render().el);
            //$('#items-footer').html(new ListFooterView().render({hidden:1}).el);
        }
        this.views[selector] = view;
        return view;
    },
};


// A class to store the state of a view, not persisted on Parse
window.ViewState = Parse.Object.extend("ViewState", {
    defaults: { filter: "all" }
});


// A collection of methods available to all views
window.View = Parse.View.extend({

    close: function () {
        if (this.beforeClose) {
            this.beforeClose();
        }
        this.remove();
        this.unbind();
    },
    
    currentUser: function() {
        if (Parse.User.current()) {
            return Parse.User.current().escape("username");
        }
        else {
            return "";
        }
    },
    
    // Display login/signup box if needed
    loggedIn: function loggedIn() {
        if (Parse.User.current()) {
            return true;
        }
        else {
            return false;
        }
    },
    
    // Logs out the user and shows the login view
    logOut: function(e) {
        Parse.User.logOut();
        application.views['#header'].render();
    },
    
    showDatePicker: function (e) {
        $(e.currentTarget).datepicker({
        format: "yyyy-mm-dd",
            });
    },
});



window.ListView = window.View.extend({


    // Delegated events for creating new items, and clearing completed ones.
    events: {
        "keypress #new-item": "createOnEnter",
        "focus .datepicker": "showDatePicker",
        "click #clear-completed": "clearCompleted",
        "click #toggle-all": "toggleAllComplete",
        "click .log-out": "logOut",
        "click #filters a,button": "selectFilter"
    },
    

    initialize: function() {
        var self = this;
        
        // Bind to Backbone events to track changes to the collection
        _.bindAll(this, 'addOne', 'addAll', 'renderWithFilter',
            'footer', 'toggleAllComplete', 'logOut',
            'createOnEnter');
        
        //Subviews
        this.footerView = new ListFooterView;
        
    },

    render: function() {
        var self = this;
        // Fetch a parent object is needed
        // Note that query.get is async
        if (this.parentId && !this.parent) {
            var query = new Parse.Query(this.parentClass);
            query.get(this.parentId, {
                success: function(object) {
                    self.parent = object;
                    self.renderList();
                    },
            });
        }
        // otherwise just render the list
        else {
            this.renderList();
        }
        return this;
    },
    
    renderList: function() {
        // Main items management template
        $(this.el).html(this.template({
            title: this.parent? this.parent.get('name') : this.collection.replace(/List/, 's'),
            parentId: this.parentId,
            }));
        
        this.input = this.$("#new-item");
        this.allCheckbox = this.$("#toggle-all")[0];

        // Create our collection of items
        var collectionConstructor = window[this.collection];
        this.items = new collectionConstructor;
        
        // Setup the query for the collection to look for items from the current user
        this.items.query = new Parse.Query(this.items.model);
        this.items.query.equalTo("user", Parse.User.current());

        // Filter by parent if needed
        if (this.parent) {
            this.items.query.equalTo(this.parentKey, this.parent);
        }
        
        this.items.bind('add', this.addOne);
        this.items.bind('reset', this.addAll);
        this.items.bind('all', this.footer);
        // Fetch all the items (async)
        this.items.fetch();

        this.state = new ViewState;
        this.state.on("change", this.filter, this);

        return this;
    },

    // Render the list footer
    footer: function() {
        var self = this;
        var hidden = this.items.hidden().length;
        var remaining = this.items.remaining().length;

        this.$('#items-footer').html(this.footerView.render({
            total: this.items.length,
            hidden: hidden,
            remaining: remaining
            }).el);
        this.delegateEvents();
    },
    
    // Filters the list based on which type of filter is selected
    selectFilter: function(e) {
        var el = $(e.target);
        var filterValue = el.attr("id");
        this.state.set({ filter: filterValue });
        Parse.history.navigate(filterValue);
    },
    
    filter: function() {
        var filterValue = this.state.get("filter");
        this.$("ul#filters a").removeClass("selected");
        this.$("ul#filters a#" + filterValue).addClass(
            "selected");
        if (filterValue === "all") {
            this.addAll();
        } else if (filterValue === "completed") {
            this.renderWithFilter(function(item) {
                return item.get('hidden')
            });
        } else {
            this.renderWithFilter(function(item) {
                return !item.get('hidden')
            });
        }
    },
    
    // Resets the filters to display all items
    resetFilters: function() {
        this.$("ul#filters a").removeClass("selected");
        this.$("ul#filters a#all").addClass("selected");
        this.addAll();
    },
    
    // Add a single item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(item) {
        var itemView = this.itemView? this.itemView : this.collection + "ItemView";
        var itemConstructor = window[itemView];
        var view = new itemConstructor({
            model: item
        });
        this.$("#items-list").append(view.render().el);
    },
    
    // Add all items in the Todos collection at once.
    addAll: function(collection, filter) {
        this.$("#items-list").html("");
        this.items.each(this.addOne);
    },
    
    // Only adds some items, based on a filtering function that is passed in
    renderWithFilter: function(filter) {
        var self = this;
        this.$("#items-list").html("");
        this.items.chain().filter(filter).each(function(
            item) {
            self.addOne(item)
        });
    },
    
    // If you hit return in the main input field, create new Todo model
    createOnEnter: function(e) {
        var self = this;
        if (e.keyCode != 13) return;
        var item = {};
        item['name'] = this.input.val();
        item['order'] = this.items.nextOrder();
        item['hidden'] = false;
        item['user'] = Parse.User.current();
        item['ACL'] = new Parse.ACL(Parse.User.current());
        // create relationship if needed
        if (this.parent) {
            item[this.parentKey] = this.parent;
        }
        
        // use wait: true so the create call is synchronuous, so we get
        // the new object id before rendering it.
        // http://stackoverflow.com/questions/11628076/backbone-js-getting-id-from-collection-create
        this.items.create(item, { wait: true } );
        this.input.val('');
        this.resetFilters();
    },
    
    // Clear all hidden items, destroying their models.
    clearCompleted: function() {
        _.each(this.items.hidden(), function(item) {
            item.destroy();
        });
        return false;
    },
    
    toggleAllComplete: function() {
        var hidden = this.allCheckbox.checked;
        this.items.each(function(item) {
            item.save({
                'hidden': hidden
            });
        });
    }
});


window.ListItemView = Parse.View.extend({

    // these elements are inserted into the html (do not include in the template)
    //tagName: "li",
    //className: "list-item",

    // The DOM events specific to an item.
    events: {
        "click #toggle": "toggleHidden",
        "dblclick label.item-content": "edit",
        "click .item-destroy": "clear",
        "keypress .form-control": "updateOnEnter",
        "blur .form-control": "updateOnBlur",
        "focus .datepicker": "showDatePicker",
    },
    
    // The ItemView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a Todo and a ItemView in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
        _.bindAll(this, 'render', 'close', 'remove');
        this.model.bind('change', this.render);
        this.model.bind('destroy', this.remove);
    },
    
    // Re-render the contents of the item.
    render: function() {
        $(this.el).html(this.template(this.model.toJSON()));
        this.input = this.$('.edit');
        return this;
    },
    
    // Toggle the `"hidden"` state of the model.
    toggleHidden: function() {
        this.model.toggle();
    },
    
    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
        $(this.el).addClass("editing");
        this.input.focus();
    },
    
    // Close the `"editing"` mode, saving changes to the item.
    close: function(attribute, value) {
        var item = {};
        //console.log(attribute);
        //console.log(value);
        // If the value has changed
        if (value != this.model.get(attribute)) {
            item[attribute] = value;
            if (this.model.onSave) {
                item = this.model.onSave(attribute, item);
            }
            
            this.model.save(item);
            }

        $(this.el).removeClass("editing");
    },
    
    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
        if (e.keyCode == 13) this.close(e.currentTarget.id, e.currentTarget.value);
    },
    
    // If you hit `enter`, we're through editing the item.
    updateOnBlur: function(e) {
        //console.log(e);
        this.close(e.currentTarget.id, e.currentTarget.value);
    },

    showDatePicker: function (e) {
        $(e.currentTarget).datepicker({
        format: "yyyy-mm-dd",
            });
    },
    
    // Remove the item, destroy the model.
    clear: function() {
        this.model.destroy();
    }
});


window.ListFooterView = Parse.View.extend({
    
    initialize: function () {
    },
        
    render: function ( arguments ) {
        $(this.el).html(this.template( arguments));
        return this;
    }
});



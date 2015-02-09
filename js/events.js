

$(document).ready(function(){
    Parse.$ = jQuery;
    // Initialize Parse with your Parse application javascript keys
    Parse.initialize("wGYAykVsrK8WH2lVOzl7onsve70NXTRPLUiiubJt",
        "pmDe3AVfHIaMqYvHhLpfOtTCnpuqjJFy0D9Qsuok");
    /*
     * Model
     * Note that you don't need to create a class on Parse, it will be autocreated.
     * The class name can be changed as needed.
     * To autocreate attributes add them to this.items.create() below, not to default.
     * The attributes are only autocrewated when the first object is added.
     */
    // Our basic Todo model has `content`, `order`, and `hide` attributes.
    var Item = Parse.Object.extend("Event", {
        // Default attributes for the item.
        defaults: {
            timeline: getUrlParameter(name),
            content: "empty item...",
            hidden: false,
            year: "2015",
            month: "January"
        },
        // Ensure that each item created has `content`.
        initialize: function() {
            if (!this.get("content")) {
                this.set({
                    "content": this.defaults.content
                });
            }
        },
        // Toggle the `hidden` state of this item.
        toggle: function() {
            this.save({
                hidden: !this.get("hidden")
            });
        }
    });

  
    // This is the transient application state, not persisted on Parse
    var AppState = Parse.Object.extend("AppState", {
        defaults: {
            filter: "all"
        }
    });
    // Items Collection
    // ---------------
    var ItemList = Parse.Collection.extend({
        // Reference to this collection's model.
        model: Item,
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
        // We keep the Todos in sequential order, despite being saved by unordered
        // GUID in the database. This generates the next order number for new items.
        nextOrder: function() {
            if (!this.length) return 1;
            return this.last().get('order') + 1;
        },
        // Todos are sorted by their original insertion order.
        comparator: function(item) {
            return item.get('year');
        }
    });
    // Item View
    // --------------
    // The DOM element for an item...
    var ItemView = Parse.View.extend({
        //... is a list tag.
        // this element is inserted into the html (do not include in the template)
        tagName: "tr",
        className: "capsule",
        // Cache the template function for a single item.
        template: _.template($('#item-template').html()),
        // The DOM events specific to an item.
        events: {
            "click .toggle": "toggleHidden",
            "dblclick label.item-content": "edit",
            "click .item-destroy": "clear",
            "keypress .edit": "updateOnEnter",
            "blur .edit": "close"
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
            item[attribute] = value;
            this.model.save(item);
            $(this.el).removeClass("editing");
        },
        // If you hit `enter`, we're through editing the item.
        updateOnEnter: function(e) {
            if (e.keyCode == 13) this.close(e.currentTarget.id, e.currentTarget.value);
        },
        // Remove the item, destroy the model.
        clear: function() {
            this.model.destroy();
        }
    });
    // The Application
    // ---------------
    // The main view that lets a user manage their items
    var ManageTodosView = Parse.View.extend({
        // Our template for the line of statistics at the bottom of the app.
        statsTemplate: _.template($('#stats-template').html()),
        // Delegated events for creating new items, and clearing completed ones.
        events: {
            "keypress #new-item": "createOnEnter",
            "click #clear-completed": "clearCompleted",
            "click #toggle-all": "toggleAllComplete",
            "click .log-out": "logOut",
            "click ul#filters a": "selectFilter"
        },
        el: ".content",
        // At initialization we bind to the relevant events on the `Todos`
        // collection, when items are added or changed. Kick things off by
        // loading any preexisting items that might be saved to Parse.
        initialize: function() {
            var self = this;
            _.bindAll(this, 'addOne', 'addAll', 'addSome',
                'render', 'toggleAllComplete', 'logOut',
                'createOnEnter');
                                            
            var name = decodeURIComponent(getUrlParameter("name"));
            // Main items management template
            this.$el.html(_.template($("#manage-items-template").html(), {title: name}));
            this.input = this.$("#new-item");
            this.allCheckbox = this.$("#toggle-all")[0];
            // Create our collection of Todos
            this.items = new ItemList;
            // Setup the query for the collection to look for items from the current user
            this.items.query = new Parse.Query(Item);
            this.items.query.equalTo("user", Parse.User.current());
            this.items.query.equalTo("timeline", name);
            this.items.bind('add', this.addOne);
            this.items.bind('reset', this.addAll);
            this.items.bind('all', this.render);
            // Fetch all the items for this user
            this.items.fetch();
            state.on("change", this.filter, this);
        },
        // Logs out the user and shows the login view
        logOut: function(e) {
            Parse.User.logOut();
            new LogInView();
            this.undelegateEvents();
            delete this;
        },
        // Re-rendering the App just means refreshing the statistics -- the rest
        // of the app doesn't change.
        render: function() {
            var hidden = this.items.hidden().length;
            var remaining = this.items.remaining().length;
            this.$('#items-stats').html(this.statsTemplate({
                total: this.items.length,
                hidden: hidden,
                remaining: remaining
            }));
            this.delegateEvents();
            this.allCheckbox.checked = !remaining;
        },
        // Filters the list based on which type of filter is selected
        selectFilter: function(e) {
            var el = $(e.target);
            var filterValue = el.attr("id");
            state.set({
                filter: filterValue
            });
            Parse.history.navigate(filterValue);
        },
        filter: function() {
            var filterValue = state.get("filter");
            this.$("ul#filters a").removeClass("selected");
            this.$("ul#filters a#" + filterValue).addClass(
                "selected");
            if (filterValue === "all") {
                this.addAll();
            } else if (filterValue === "completed") {
                this.addSome(function(item) {
                    return item.get('hidden')
                });
            } else {
                this.addSome(function(item) {
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
            var view = new ItemView({
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
        addSome: function(filter) {
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
            this.items.create({
                timeline: decodeURIComponent(getUrlParameter("name")),
                content: this.input.val(),
                order: this.items.nextOrder(),
                hidden: false,
                user: Parse.User.current(),
                ACL: new Parse.ACL(Parse.User.current()),
            });
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
    var LogInView = Parse.View.extend({
        events: {
            "submit form.login-form": "logIn",
            "submit form.signup-form": "signUp"
        },
        el: ".content",
        initialize: function() {
            _.bindAll(this, "logIn", "signUp");
            this.render();
        },
        logIn: function(e) {
            var self = this;
            var username = this.$("#login-username").val();
            var password = this.$("#login-password").val();
            Parse.User.logIn(username, password, {
                success: function(user) {
                    new ManageTodosView();
                    self.undelegateEvents();
                    delete self;
                },
                error: function(user, error) {
                    self.$(".login-form .error")
                        .html(
                            "Invalid username or password. Please try again."
                        ).show();
                    self.$(".login-form button")
                        .removeAttr("disabled");
                }
            });
            this.$(".login-form button").attr("disabled",
                "disabled");
            return false;
        },
        signUp: function(e) {
            var self = this;
            var username = this.$("#signup-username").val();
            var password = this.$("#signup-password").val();
            Parse.User.signUp(username, password, {
                ACL: new Parse.ACL()
            }, {
                success: function(user) {
                    new ManageTodosView();
                    self.undelegateEvents();
                    delete self;
                },
                error: function(user, error) {
                    self.$(
                            ".signup-form .error"
                        ).html(_.escape(error.message))
                        .show();
                    self.$(
                        ".signup-form button"
                    ).removeAttr("disabled");
                }
            });
            this.$(".signup-form button").attr("disabled",
                "disabled");
            return false;
        },
        render: function() {
            this.$el.html(_.template($("#login-template").html()));
            this.delegateEvents();
        }
    });
    // The main view for the app
    var AppView = Parse.View.extend({
        // Instead of generating a new element, bind to the existing skeleton of
        // the App already present in the HTML.
        el: $("#app-container"),
        initialize: function() {
            this.render();
        },
        render: function() {
            if (Parse.User.current()) {
                new ManageTodosView();
            } else {
                new LogInView();
            }
        }
    });
    var AppRouter = Parse.Router.extend({
        routes: {
            "all": "all",
            "active": "active",
            "completed": "completed"
        },
        initialize: function(options) {},
        all: function() {
            state.set({
                filter: "all"
            });
        },
        active: function() {
            state.set({
                filter: "active"
            });
        },
        completed: function() {
            state.set({
                filter: "completed"
            });
        }
    });
    var state = new AppState;
    new AppRouter;
    new AppView;
    Parse.history.start();
});


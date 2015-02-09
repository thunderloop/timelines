window.LoginView = Parse.View.extend({
    
    events: {
        "submit form#form-signin": "logIn",
        "submit form#form-signup": "signUp"
    },
    
    initialize: function() {
        _.bindAll(this, "logIn", "signUp");
    },
    
    render: function() {
        $(this.el).html(this.template());
        this.delegateEvents();
        return this;
    },
    
    logIn: function(e) {
        var self = this;
        var username = this.$("#login-username").val();
        var password = this.$("#login-password").val();
        Parse.User.logIn(username, password, {
            success: function(user) {
                application.views['#header'].render();
                application.showView('#content', application.views['#content']);
                self.undelegateEvents();
                delete self;
            },
            error: function(user, error) {
                self.$("#form-signin .alert").html("Invalid credentials. Please try again.").show();
                self.$("#form-signin button").removeAttr("disabled");
            }
        });
        this.$("#form-signin button").attr("disabled", "disabled");
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
                application.views['#header'].render();
                application.views['#content'].render();
                self.undelegateEvents();
                delete self;
            },
            error: function(user, error) {
                self.$("#form-signup .error").html(_.escape(error.message)).show();
                self.$("#form-signup button").removeAttr("disabled");
            }
        });
        this.$("#form-signin button").attr("disabled", "disabled");
        return false;
    },
    

});
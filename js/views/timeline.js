window.TimelineView = window.ListView.extend({

    collection: 'EventList',
    parentKey: 'timelineId',
    parentClass: 'Timeline',
    itemView: 'TimelineItemView',
    
    initialize: function(arguments) {
            _.extend(this, _.pick(arguments, "parentId"));
            ListView.prototype.initialize.apply(this, arguments);
    },
});


window.TimelineItemView = window.ListItemView.extend({
    tagName: "li",
    className: "capsule",

    
    // The DOM events specific to an item.
    events: {
        "click #toggle": "toggleHidden",
        "dblclick label.item-content": "edit",
        "click .item-destroy": "clear",
        "keypress .form-control": "updateOnEnter",
        "blur .form-control": "close",
        "dragover": "handleDragOver",
        "drop": "handleFileSelect",
        },


    handleDrop: function (event) {
        if(event.preventDefault) event.preventDefault();

        this.model.set( 'hidden', true);
        this.model.save();
    },

    handleFileSelect: function (evt) {
        // Originally solved by Tim Branyen in his drop file plugin
        // http://dev.aboutnerd.com/jQuery.dropFile/jquery.dropFile.js
        jQuery.event.props.push('dataTransfer');
        evt.stopPropagation();
        evt.preventDefault();
 
        var url = $(evt.dataTransfer.getData('text/html')).filter('a').attr('href');

        if (url) {
            // a url was dropped, use that
            this.model.set('imageURL', url);
            this.model.save();
        }
        else {
            $(evt.currentTarget).html('<div style="text-align: center;"><img src="images/spinner.gif" class="spinner"/></div>');
            // an image was dropped, upload it
            var files = evt.dataTransfer.files; // FileList object.
                // files is a FileList of File objects. List some properties.
                var output = [];
                for (var i = 0, f; f = files[i]; i++) {
                    var parseFile = new Parse.File(f.name, f);
                    var thisObject = this.model;
                    parseFile.save().then(function() {
                        //console.log(parseFile._url);
                        thisObject.set('image', parseFile);
                        thisObject.set('imageURL', parseFile._url);
                        thisObject.save();
                    }, function(error) {
                    });

                }
        }
    },
    
    handleDragOver: function (evt) {
        // Originally solved by Tim Branyen in his drop file plugin
        // http://dev.aboutnerd.com/jQuery.dropFile/jquery.dropFile.js
        if (!evt.dataTransfer) jQuery.event.props.push('dataTransfer');
        evt.stopPropagation();
        evt.preventDefault();
        if (evt.dataTransfer) {
            // Explicitly show this is a copy (browser changes the mouse cursor)
            evt.dataTransfer.dropEffect = 'copy';
        }
    },
    
});

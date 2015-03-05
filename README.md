To create a new class name "object" "with a list page and edit detail page:

#. duplicate js/models/timelinemodel.js to objectmodel.js
#. change the class names in objectmodel.js to application.Object and application.ObjectList. Change the model in ObjectList to Object.
#. duplicate js/views/timelinelist.js to objectlist.js
# change the class names in objectlist.js to application.ObjectListView and application.ObjectListItemView.
# in js/app.js, clone the "timelines": "timelines", route and replace it with "objects" : "objects". Also clone the corresponding function, change it to instanciate and ObjectListView.

You can now visit file://.../app.html#objects. Avfter the signup and login you will see and empty list of Objects. Object can be added.

To create add new properties to Object, just define their default values in Object.defaults.

To create a new view template for a list or a list item:
# clone one of the default template (e.g. tpl/ListItemView.html) and rename it to match the class names above, e.g. ObjectListItemView.html.
# in app.js, add this new file to the call to application.loadTemplates

That's it. The template will be loaded and used automatically instead of the deafult template when the corresponding view is displayed. You can customize now the code inside that view.




Bootstrap inline form examples

<form class="form-horizontal" role="form">
<div class="form-group">
<div class="col-md-6">
<input type="text" class="form-control" id="inputType" placeholder="Type">
</div>
<div class="col-md-6">
<input type="text" class="form-control" id="inputType" placeholder="Type">
</div>
<div class="col-md-6">
<div class="form-group row">
<div class="col-md-6">
<input type="text" class="form-control" id="inputKey" placeholder="Key">
</div>
<div class="col-md-6">
<input type="text" class="form-control" id="inputValue" placeholder="Value">
</div>
</div>
</div>
</div>
</form>



<table class="table table-striped">
<thead>
<tr>
<th>Row</th>
<th>First Name</th>
<th>Last Name</th>
<th>Email</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td contenteditable>John</td>
<td>Carter</td>
<td>johncarter@mail.com</td>
</tr>
<tr>
<td>2</td>
<td contenteditable>Peter</td>
<td>Parker</td>
<td>peterparker@mail.com</td>
</tr>
<tr>
<td>3</td>
<td contenteditable>John</td>
<td>Rambo</td>
<td>johnrambo@mail.com</td>
</tr>
</tbody>
</table>


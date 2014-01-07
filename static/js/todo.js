// Backbone code for Todo Functionality

// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){

  // Todo Model
  // ----------

  // Our basic **Todo** model has `title`, `description`, `date`, and `done` attributes.
  var Todo = Backbone.Model.extend({

    // Default attributes for the todo item.
    defaults: function() {
      return {
        title: "empty todo...",
        description: "",
        date: Date.now(),
        done: false
      };
    },

    parse: function(data) {
        data.date = new Date(data.date)
        return data;
    },

    // Ensure that each todo created has `title`.
    initialize: function() {
      if (!this.get("title")) {
        this.set({"title": this.defaults().title});
      }
    },

    // Toggle the `done` state of this todo item.
    toggle: function() {
      this.save({done: !this.get("done")});
    }

  });

  // Todo Collection
  // ---------------

  // The collection of todos is backed by *localStorage* instead of a remote
  // server.
  var TodoList = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Todo,
    url: '/todo/api/',

    // Filter down the list of all todo items that are finished.
    done: function() {
      return this.filter(function(todo){ return todo.get('done'); });
    },

    // Filter down the list to only todo items that are still not finished.
    remaining: function() {
      return this.without.apply(this, this.done());
    },

    // We keep the Todos in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    //nextOrder: function() {
      //if (!this.length) return 1;
      //return this.last().get('order') + 1;
    //},

    comparator: function(model) {
            return -model.get('date').getTime();
    },

  });

  // Create our global collection of **Todos**.
  var Todos = new TodoList;

  // Todo Item View
  // --------------

  // The DOM element for a todo item...
  var TodoView = Backbone.View.extend({

    //... is a list tag.
    tagName:  "tr",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
      "click .check-done"   : "toggleDone",
      "click .edit"     : "edit",
      "click a.destroy" : "clear",
      "keypress .edit"  : "updateOnEnter",
      "blur .edit"      : "close"
    },

    // The TodoView listens for changes to its model, re-rendering.
    // Since there's
    // a one-to-one correspondence between a **Todo** and a **TodoView**
    // in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'destroy', this.remove);
    },

    // Re-render the titles of the todo item.
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.addToggleClasses();
      this.$('.check-done').prop("checked", this.model.get('done'));
      this.$el.addClass("task");
      this.input = this.$('.edit');
      this.initEdit();
      return this;
    },

    addToggleClasses: function() {
      this.$el.toggleClass('done', this.model.get('done'));
      this.$el.toggleClass('old', this.model.get('date') < Date.now());
      this.$el.toggleClass('pending', this.model.get('date') >= Date.now()
                                      && !this.model.get('done'));
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function() {
      this.model.toggle();
    },

    initEdit: function() {
      var todo = this;
      this.$('.task-title').editable({
        success: function(response, newValue) {
            todo.model.set('title', newValue); //update backbone model
            todo.model.save();
        }
      });
      this.$('.task-description').editable({
        success: function(response, newValue) {
            todo.model.set('description', newValue); //update backbone model
            todo.model.save();
        }
      });
      this.$('.task-date').editable({
        success: function(response, newValue) {
            todo.model.set('date', newValue.toDate()); //update backbone model
            todo.model.save();
            Todos.sort(); // Avoid the order to get outdated
        }
      });
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function(ev) {
      this.$el.addClass("editing");
      this.input.focus();
      ev.preventDefault();
    },

    // Close the `"editing"` mode, saving changes to the todo.
    close: function() {
      var value = this.input.val();
      if (!value) {
        this.clear();
      } else {
        this.model.save({title: value});
        this.$el.removeClass("editing");
      }
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
    }

  });

  // The Application
  // ---------------

  // Our overall **AppView** is the top-level piece of UI.
  var AppView = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#todoapp"),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "click #submit-new-todo":  "createOnClick",
      "click #clear-completed": "clearCompleted",
      "click #toggle-all": "toggleAllComplete",
      "click #newer-todo": "newer_first",
      "click #older-todo": "older_first",
      "change #filter-todo": "change_filter",
    },

    // At initialization we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos.
    initialize: function() {
      this.quotes = $($('#quotes').html()).filter('blockquote');

      this.inputTitle = this.$("#new-todo");
      this.inputDescription = this.$("#new-todo-description");
      this.inputDate = this.$("#new-todo-date");
      var datepicker = $('#new-todo-date').datepicker();
      datepicker.on('changeDate', function(){
        datepicker.datepicker('hide');
      });
      this.allCheckbox = this.$("#toggle-all")[0];
      this.filter = this.$("#filter-todo");
      this.todo_list = this.$('#todo-list');

      this.listenTo(Todos, 'add', this.addOne);
      this.listenTo(Todos, 'reset', this.addAll);
      this.listenTo(Todos, 'all', this.render);

      this.main = $('#main');

      Todos.fetch();
    },

    render: function() {
        //$('.task').remove()
        this.todo_list.html(_.template($('#table-template').html()));
        this.addAll();
    },

    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the todo_list.
    addOne: function(todo) {
      var view = new TodoView({model: todo});
      this.todo_list.append(view.render().el);
    },

    // Add all items in the **Todos** collection at once.
    addAll: function() {
      Todos.each(this.addOne, this);
    },

    // If you submit the form for news Todo, create new **Todo** model,
    // persisting it.
    createOnClick: function(e) {
      Todos.create({title: this.inputTitle.val(),
                   description: this.inputDescription.val(),
                   date: new Date(this.inputDate.val())});
      this.inputTitle.val('');
      this.inputDescription.val('');
      this.inputDate.val('');

      this.$('#quote-alert').remove();
      this.$el.prepend(_.template($('#quote-template').html()));
      $('#quote-display').html(this.quotes[Math.floor(Math.random() * this.quotes.length)]);
    },

    // Clear all done todo items, destroying their models.
    clearCompleted: function() {
      _.invoke(Todos.done(), 'destroy');
      return false;
    },

    toggleAllComplete: function () {
      var done = this.allCheckbox.checked;
      Todos.each(function (todo) { todo.save({'done': done}); });
    },

    newer_first: function (ev) {
        ev.preventDefault();
        // update comparator function
        Todos.comparator = function(model) {
            return -model.get('date').getTime();
        };
        Todos.sort();
    },

    older_first: function (ev) {
        ev.preventDefault();
        // update comparator function
        Todos.comparator = function(model) {
            return model.get('date').getTime();
        };
        Todos.sort();
    },

    /* Enable or disable the classes of the table required
     * for filtering rows
     */
    change_filter: function () {
        var selected = this.filter.val();
        this.todo_list.removeClass('todo-list-old');
        this.todo_list.removeClass('todo-list-pending');
        this.todo_list.removeClass('todo-list-completed');
        if (selected === 'old' ){
            this.todo_list.addClass('todo-list-old');
        } else if (selected === 'pending') {
            this.todo_list.addClass('todo-list-pending');
        } else if (selected === 'completed'){
            this.todo_list.addClass('todo-list-completed');
        }
    }

  });

  // Finally, we kick things off by creating the **App**.
  var App = new AppView;

});

Date.prototype.format = function(format) {
  var o = {
    "M+" : this.getMonth()+1, //month
    "d+" : this.getDate(),    //day
    "h+" : this.getHours(),   //hour
    "m+" : this.getMinutes(), //minute
    "s+" : this.getSeconds(), //second
    "q+" : Math.floor((this.getMonth()+3)/3),  //quarter
    "S" : this.getMilliseconds() //millisecond
  }

  if(/(y+)/.test(format)) format=format.replace(RegExp.$1,
    (this.getFullYear()+"").substr(4 - RegExp.$1.length));
  for(var k in o)if(new RegExp("("+ k +")").test(format))
    format = format.replace(RegExp.$1,
      RegExp.$1.length==1 ? o[k] :
        ("00"+ o[k]).substr((""+ o[k]).length));
  return format;
};//author: meizz

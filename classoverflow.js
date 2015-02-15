// classoverflow.js
Errors = new Mongo.Collection("errors");
  // errorID, createdAt
Hints = new Mongo.Collection("hints");
  // errorID, createdAt, hintMsg, upvotes

if (Meteor.isClient) {
  // This code only runs on the client
  Template.body.helpers({
    errors: function () {
      return Errors.find({}, {sort: {errorID: 1}});
    }
  });

  Template.body.events({
    "submit .new-error-entry": function (event) {
      // This function is called when the search for ID/submit new ID blank is submitted

      var query = event.target.text.value;
      var query_count = Errors.find({"errorID": query}).count();

      if (query_count==0) {
        Errors.insert({
          errorID: query,
          createdAt: new Date()
        });
      }
      else {
        // navigate
      }

      // Clear form
      event.target.text.value = "";

      // Prevent default form submit
      return false;
    }
  });

  Template.error_entry.events({
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      Errors.update(this._id, {$set: {checked: ! this.checked}});
    },
    "click .delete": function () {
      Errors.remove(this._id);
    }
  });
}
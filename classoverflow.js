// classoverflow.js
Errors = new Mongo.Collection("errors");
  // errorID, createdAt
// Hints = new Mongo.Collection("hints");
  // errorID, createdAt, hintMsg, upvotes

if (Meteor.isClient) {
  // This code only runs on the client
  Template.body.helpers({
    errors: function () {
      return Errors.find({}, {sort: {errorID: 1}});
    },
    //hints: function () {
    //  return Errors.find({_id: this.id}, {'hints.hintMsg': 1, 'hints.upvotes': 1, _id:0}).sort({'hints.upvotes': 1});
    //}
  });

  Template.body.events({
    "submit .new-error-entry": function (event) {
      // This function is called when the search for ID/submit new ID blank is submitted

      var query = event.target.text.value;
      var query_count = Errors.find({"errorID": query}).count();

      if (query_count==0) {
        Errors.insert({
          errorID: query,
          createdAt: new Date(),
          hints: new Array()
        });
      }
      else {
        // todo: navigate
      }

      event.target.text.value = ""; // Clear form
      return false;                 // Prevent default form submit
    },
    "submit .new-hint-entry": function(event) {
      var hint = event.target.text.value;
      console.log(event);
      var errorDBid = this._id;

      Errors.update(errorDBid, {$push: {hints: {
          _id: ObjectId(),
          hintMsg: hint, 
          upvotes: 0, 
          parent: errorDBid
      }}});

      event.target.text.value = "";
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
    },
    "click .upvote": function() {
      console.log(this._id);
      Errors.update(this.parent, {$set: {"hints.$.hintMsg": "asdf"}});
    }
  });
}
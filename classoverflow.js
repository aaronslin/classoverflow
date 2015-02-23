// classoverflow.js
Errors = new Mongo.Collection("errors");
  // errorID, createdAt
Hints = new Mongo.Collection("hints");
  // errorID, createdAt, hintMsg, upvotes

/*$.fn.scrollView = function () {
  return this.each(function(){
    $('html, body').animate({
      scrollTop:$(this).offset().top
    },1000);
  });
}*/

if (Meteor.isClient) {
  // This code only runs on the client
  Template.body.helpers({
    errors: function () {
      return Errors.find({}, {sort: {errorID: 1}});
    }
  });

  Template.error_entry.helpers({
    hintIDs: function () {
      return Errors.find({"_id": this._id}); 
    },
    sortedHints: function() {
      var hintIDList = this.hints.map(function(hintIDObject) {
        return hintIDObject.hintID;
      });
      return Hints.find({"_id": {$in: hintIDList}}, {sort: {upvotes: -1}});
    }
  });

  // BEGIN EXTINCT
  Template.hint_entry.helpers({
    getHintInfo: function(hint) {
      return Hints.find({"_id": hint});
    }
  });
  // END EXTINCT

  Template.body.events({
    "submit .new-error-entry": function (event) {
      // This function is called when the search for ID/submit new ID blank is submitted

      var query = event.target.text.value;
      var query_count = Errors.find({"errorID": query}).count();

      if (query_count==0) {
        Errors.insert({
          errorID: query,
          createdAt: new Date(),
          hints: new Array(),
          numRequests: 1
        });
      }
      else {
        // todo: navigate
        //console.log($())
        $('#errorID-'+query).scrollView();
      }

      event.target.text.value = ""; // Clear form
      return false;                 // Prevent default form submit
    },
    "submit .new-hint-entry": function(event) {
      var hint = event.target.text.value;
      //console.log(event);
      var errordbkey = this._id;
      var hintID;
        Hints.insert({
          parent: errordbkey,
          hintMsg: hint,
          upvotes: 0
        },
        function (err, object) {
          hintID = object; // the _id of the hint
          Errors.update(errordbkey, {$push: {hints: {hintID: hintID}}});
      });


      //Errors.update(this._id, {$push: {hints: {hintMsg: hint, upvotes: 0}}});

      event.target.text.value = "";
      return false;
    }
  });

  Template.error_entry.events({
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      Errors.update(this._id, {$set: {checked: ! this.checked}});
    },
    "click .delete_error": function () {
      // For each hint stored, delete the hint
      Errors.remove(this._id);
    },
    "click .delete_hint": function() {
      console.log(this);
      //Hints.remove({"_id:": this.hintID});
      //Errors.update(this.parent, {$pull: {'hints': this.hintID}});
    },
    "click .upvote": function(event, template) {
      Hints.update({"_id":this._id},{$inc: {upvotes:1}});
      //e.preventDefault();
      //Meteor.call('upvote', this._id);
      //Errors.update(this._id, {$inc: {upvotes: 1}});
      //Errors.update(this._id, {$inc: {hints: {hintMsg: upvotes: 1}}})
      //Errors.update(this._id, {$inc: {hints: {hintMsg: hint, upvotes: 0}}});
      //console.log('upvote',this._id, event, template, this)
    },
    "click .addRequest": function(event, template) {
        Errors.update({"_id":this._id},{$inc: {numRequests:1}})
    }
  });
}

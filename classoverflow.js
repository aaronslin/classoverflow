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
      return Errors.find({}, {sort: {errorCoord0: 1, errorCoord1: 1, errorCoord2:1}});
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
      //event.preventDefault();
      console.log('error submitted',event.target)
      var query0 = event.target.errorCoord0.value;
      var query1 = event.target.errorCoord1.value;
      var query2 = event.target.errorCoord2.value;
      var query_count = Errors.find({"errorCoord0": query0, "errorCoord1": query1, "errorCoord2": query2}).count();
      console.log(query_count)
      if (query_count==0) {
        Errors.insert({
          //errorID: query,
          errorCoord0 : query0,
          errorCoord1 : parseInt(query1),
          errorCoord2 : parseInt(query2),
          createdAt: new Date(),
          hints: new Array(),
          numRequests: 1
        });

        console.log('We\'ve added this to our database and displayed it.');
      }
      else {
        // todo: navigate
        //console.log($())
        //$('#errorID-'+query).scrollView();
        console.log('Its here on this (sorted) page!');
      };

      event.target.errorCoord0.value = ""; // Clear form
      event.target.errorCoord1.value = ""; // Clear form
      event.target.errorCoord2.value = ""; // Clear form
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

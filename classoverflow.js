// classoverflow.js
Errors = new Mongo.Collection("errors");
Hints = new Mongo.Collection("hints");
Users = new Mongo.Collection("users");

var scrollLocationPrevious = "#inputErrorCoords";
var loggedIn = 0;

function scrollAndHighlight(scrollLocation) {
  $(scrollLocationPrevious).removeAttr("style");
  $(scrollLocation).css("background-color","lightyellow");
  scrollLocationPrevious = scrollLocation;
  $('html, body').animate({
    scrollTop: $(scrollLocation).offset().top-130
    }, 1000);
}

if (Meteor.isClient) {
  Meteor.startup(function () {
    Session.set("currentUsername","defaultUser");
  });

  // Template helpers
  Template.body.helpers({
    errors: function () {
      return Errors.find({}, {sort: {errorCoord0: 1, errorCoord1: 1, errorCoord2:1}});
    }
  });

  Template.body.events({
    "focus .hintTextarea": function(event) {
      submitObj = $("#errorID-"+this._id).find(".addHint");
      submitObj.fadeIn();
      var element = event.target;
      $(element).animate({height: "200px"}, 200);
    },
    "blur .hintTextarea": function(event) {
      var element = event.target;
      $(element).stop().animate({height: "34px"}, 200);
      submitObj = $("#errorID-"+this._id).find(".addHint");
      //submitObj.css("display", "none");
      submitObj.fadeOut();
    }
  });

  Template.error_entry.helpers({
    hintIDs: function () {
      return Errors.find({"_id": this._id}); 
    },
    sortedHints: function () {
      var hintIDList = this.hints.map(function(hintIDObject) {
        return hintIDObject;
      });
      return Hints.find({"_id": {$in: hintIDList}}, {sort: {upvotes: -1}});
    },
    ifRequested: function () {
      currentUsername = Session.get("currentUsername");
      followed = Users.findOne({username: currentUsername}).followed;
      if ($.inArray(this._id, followed)!==-1) {
        return true;
      }
      else {
        return false;
      }

    }
  });

  Template.hint_entry.helpers({
    lineBrokenHints: function (hint) {
      var newHint = hint.split('\n').join('<br \>');
      return newHint;
    },
    ifUpvoted: function () {
      currentUsername = Session.get("currentUsername");
      upvoted = Users.findOne({username: currentUsername}).upvoted;
      if ($.inArray(this._id, upvoted)!==-1) {
        return true;
      }
      else {
        return false;
      }
    }
  });

  Template.body.events({
    "submit .new-error-entry": function (event) {
      // This function is called when the search for ID/submit new ID blank is submitted
      //event.preventDefault();
      var query0 = event.target.errorCoord0.value;
      var query1 = event.target.errorCoord1.value;
      var query2 = event.target.errorCoord2.value;

      if (!query0 || !query1 || !query2) {
        return false;
      }
      else if (!parseInt(query1) || !parseInt(query2)) {
        $("#errorMessage").html("The coordinates 'nodes' and 'time' must be integers.");
        $("#errorMessage").css("display","block").delay(2500).fadeOut(2000, "linear");
        return false;
      }

      var query = Errors.findOne({"errorCoord0": query0, 
                              "errorCoord1": parseInt(query1), 
                              "errorCoord2": parseInt(query2)});
      //var query_count = query.count();
      //console.log(query_count);
      // QUESTION: What's a work-around .findOne?
      if (!query) {
        currentUsername = Session.get("currentUsername");
        userID = Users.findOne({username: currentUsername})._id;

        Errors.insert({
          //errorID: query,
          errorCoord0 : query0,
          errorCoord1 : parseInt(query1),
          errorCoord2 : parseInt(query2),
          createdAt: new Date(),
          hints: new Array(),
          numRequests: 1
        }, function(err,object){
          scrollAndHighlight("#errorID-"+object);
          Users.update(userID, {$push: {followed: object}});
        });
        //console.log('Added to database successfully.');
      }
      else {
        scrollAndHighlight("#errorID-"+query._id);
        //console.log('Error coordinates found.');
      };

      event.target.errorCoord0.value = ""; // Clear form
      event.target.errorCoord1.value = ""; 
      event.target.errorCoord2.value = ""; 
      document.activeElement.blur();
      return false;                 // Prevent default form submit
    },
    "click .addHint": function(event) {
      //var hint = event.target.text.value;
      var errordbkey = this._id;
      var hintObject = $("#errorID-"+errordbkey).find('.hintTextarea')[0];
      var hint = hintObject.value;
      if ( $.trim( hint ) == '' ) { // Check that it's not all whitespace
        hintObject.value="";
        return false;
      }

      Hints.insert({
        parent: errordbkey,
        hintMsg: hint,
        upvotes: 0
      },
      function (err, object) {
        var hintID = object; // the _id of the hint

        // Old version: 
        //Errors.update(errordbkey, {$push: {hints: {hintID: hintID}}});
        Errors.update(errordbkey, {$push: {hints: hintID}});
      });

      //Errors.update(this._id, {$push: {hints: {hintMsg: hint, upvotes: 0}}});

      hintObject.value = "";
      return false;
    },
    "submit #nickname": function(event) {
      var username = event.target.username.value.toLowerCase();
      if (/[^a-zA-Z0-9]/.test(username) || username.length > 8) {
        $("#loginError").fadeIn();
        event.target.username.value = '';
        return false;
      }
      //$("#loginInfo").html("Logged in as: "+username);

      // Find in database
      var query = Users.findOne({"username":username});
      if (!query) {
        // User not found
        Users.insert({
          username: username,
          upvoted: new Array(),
          followed: new Array(),
          createdAt: new Date()
        });
      }

      Session.set("currentUsername", username);

      $(".in").css("display","none");
      event.target.username.value = '';
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
      // Old version:
      // Hints.update({"_id":this._id},{$inc: {upvotes:1}});
      currentUsername = Session.get("currentUsername");
      hintID = this._id;
      user = Users.findOne({username: currentUsername});
      console.log(event.target);
      if($.inArray(hintID,user.upvoted)!==-1) { // if found
        Hints.update(hintID,{$inc: {upvotes: -1}});
        Users.update(user._id,{$pull: {upvoted: hintID}});
      }
      else {
        Hints.update(hintID,{$inc: {upvotes: 1}});
        Users.update(user._id,{$push: {upvoted: hintID}});
      }
      event.target.blur();
    },
    "click .addRequest": function(event, template) {
      //Errors.update({"_id":this._id},{$inc: {numRequests:1}})
      currentUsername = Session.get("currentUsername");
      errorID = this._id;
      user = Users.findOne({username: currentUsername});
      if($.inArray(errorID,user.followed)!==-1) {
        Errors.update(errorID,{$inc: {numRequests: -1}});
        Users.update(user._id,{$pull: {followed: errorID}});
      }
      else {
        Errors.update(errorID,{$inc: {numRequests: 1}});
        Users.update(user._id,{$push: {followed: errorID}});
      }
      event.target.blur();
    }
  });
}

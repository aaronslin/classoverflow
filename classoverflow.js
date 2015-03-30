// classoverflow.js
Errors = new Mongo.Collection("errors");
Hints = new Mongo.Collection("hints");
Users = new Mongo.Collection("users");
Feedback = new Mongo.Collection("feedback");

var scrollLocationPrevious = "#inputErrorCoords";
var loggedIn = 0;

function scrollAndHighlight(scrollLocation) {
  $(scrollLocationPrevious).removeAttr("style");
  $(scrollLocation).css("background-color","lightyellow");
  scrollLocationPrevious = scrollLocation;
  $('html, body').animate({
    scrollTop: $(scrollLocation).offset().top-135
    }, 1000);
}




Meteor.methods({
  addError: function(userID, query0, query1) {
    object = Errors.insert({
      errorCoord0 : query0,
      errorCoord1 : parseInt(query1),
      createdAt: new Date(),
      hints: new Array(),
      numRequests: 0
    }, function(err,object){
      Meteor.call("followError", userID, object);
      Session.set("lastAdded", object);
    });
  },
  addHint: function(errordbkey, hint) {
    Hints.insert({
      parent: errordbkey,
      hintMsg: hint,
      upvotes: 0
    },
    function (err, hintID) {
      Errors.update(errordbkey, {$push: {hints: hintID}});
    });
  },
  addUser: function(username) {
    Users.insert({
      username: username,
      upvoted: new Array(),
      followed: new Array(),
      createdAt: new Date()
    });
  },
  addFeedback: function(userID, text) {
    Feedback.insert({
      user: userID,
      feedback: text
    });
  },
  deleteError: function(id) {
    Errors.remove(id);
  },
  upvoteHint: function(userID, hintID) {
    Hints.update(hintID,{$inc: {upvotes: 1}});
    Users.update(userID,{$push: {upvoted: hintID}});
  },
  downvoteHint: function(userID, hintID) {
    Hints.update(hintID,{$inc: {upvotes: -1}});
    Users.update(userID,{$pull: {upvoted: hintID}});
  },
  followError: function(userID, errorID) {
    Errors.update(errorID,{$inc: {numRequests: 1}});
    Users.update(userID,{$push: {followed: errorID}});
  },
  unfollowError: function(userID, errorID) {
    Errors.update(errorID,{$inc: {numRequests: -1}});
    Users.update(userID,{$pull: {followed: errorID}});
  }
});








if (Meteor.isClient) {
  Meteor.startup(function () {
    Session.set("currentUsername","defaultUser");
    Session.set("lastColWidth","70px");
    Session.set("feedbackOpen",false);
    Session.set("tabSubmit", false); 
      // There has to be a better solution than this
  });

  // Template helpers
  Template.body.helpers({
    errors: function () {
      return Errors.find({}, {sort: {errorCoord0: 1, errorCoord1: 1}}); //, errorCoord2:1}});
    }
  });

  Template.body.events({
    "focus .hintTextarea": function(event) {
      Session.set("lastColWidth","70px");
      submitObj = $("#errorID-"+this._id).find(".addHint");
      submitObj.fadeIn();
      var element = event.target;
      $(element).animate({height: "200px"}, 200);
    },
    "blur .hintTextarea": function(event) {
      var element = event.target;
      submitObj = $("#errorID-"+this._id).find(".addHint");
      if (!Session.get("tabSubmit")) {
        submitObj.fadeOut();
        Session.set("lastColWidth","70px");
        $(element).stop().animate({height: "34px"}, 200);
      }
      Session.set("tabSubmit", false);
    },
    "blur .addHint": function(event) {
      var submitObj =  $("#errorID-"+this._id).find(".addHint");
      var element = $("#errorID-"+this._id).find(".hintTextarea");
      console.log(element);
      submitObj.fadeOut();
      Session.set("lastColWidth","70px");
      $(element).stop().animate({height: "34px"}, 200);
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
      return Hints.find({"_id": {$in: hintIDList}}, {sort: {upvotes: -1, _id: 1}});
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

  Template.column_width.helpers({
    lastColWidth: function () {
      return Session.get("lastColWidth");
    }
  });

  Template.body.events({
    "submit .new-error-entry": function (event) {
      var query0 = event.target.errorCoord0.value;
      var query1 = event.target.errorCoord1.value;

      if (!query0 || !query1) {
        return false;
      }
      else if (!parseInt(query1)){ 
        //$("#errorMessage").html("Test number and time values must be integers.");
        $("#errorMessage").html("Test number must be an integer.");
        $("#errorMessage").css("display","block").delay(2500).fadeOut(2000, "linear");
        return false;
      }
      var query = Errors.findOne({"errorCoord0": query0,
                              "errorCoord1": parseInt(query1)}); 
      // QUESTION: What's a work-around .findOne?

      if (!query) {
        currentUsername = Session.get("currentUsername");
        userID = Users.findOne({username: currentUsername})._id;

        Meteor.call("addError", userID, query0, query1);
        errorID = Session.get("lastAdded");
        scrollAndHighlight("#errorID-"+errorID);
        // QUESTION: How do you return from Meteor call?
      }
      else {
        scrollAndHighlight("#errorID-"+query._id);
      };

      event.target.errorCoord0.value = "";
      event.target.errorCoord1.value = "";
      document.activeElement.blur();
      return false;
    },
    "click .addHint": function(event) {
      //var hint = event.target.text.value;
      Session.set("tabSubmit", false);
      var errordbkey = this._id;
      var hintObject = $("#errorID-"+errordbkey).find('.hintTextarea')[0];
      var hint = hintObject.value;
      if ( $.trim( hint ) == '' ) { // Check that it's not all whitespace
        hintObject.value="";
        return false;
      }

      Meteor.call("addHint",errordbkey,hint);
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
        Meteor.call("addUser",username);
      }

      Session.set("currentUsername", username);

      $(".in").css("display","none");
      event.target.username.value = '';
      return false;
    },
    "submit #feedback": function (event) {
      Meteor.call("addFeedback",
          Session.get("currentUsername"),
          event.target.feedback.value);

      Session.set("feedbackOpen",false);
      $("#feedback-dialog").fadeOut(200);
      $(".feedbackdrop").fadeOut(200);

      event.target.feedback.value = '';
      return false;
    },
    "click .activateFeedback": function() {
      Session.set("feedbackOpen",true);
      $(".feedbackdrop").fadeIn(200);
      $("#feedback-dialog").fadeIn(200);
    },
    "click .feedbackdrop": function() {
      Session.set("feedbackOpen",false);
      $("#feedback-dialog").fadeOut(200);
      $(".feedbackdrop").fadeOut(200);
    },
    "click .activateInstr": function() {
      $(".infobackdrop").fadeIn(200);
      $("#information-dialog").fadeIn(200);
    },
    "click .infobackdrop": function() {
      $(".infobackdrop").fadeOut(200);
      $("#information-dialog").fadeOut(200);
    }
  });

  Template.error_entry.events({
    "click .delete_error": function () {
      // For each hint stored, delete the hint
      Meteor.call("deleteError", this._id);
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
      if($.inArray(hintID,user.upvoted)!==-1) { // if found
        Meteor.call("downvoteHint", user._id, hintID);
      }
      else {
        Meteor.call("upvoteHint", user._id, hintID);
      }
      event.target.blur();
    },
    "click .addRequest": function(event, template) {
      //Errors.update({"_id":this._id},{$inc: {numRequests:1}})
      currentUsername = Session.get("currentUsername");
      errorID = this._id;
      user = Users.findOne({username: currentUsername});
      if($.inArray(errorID,user.followed)!==-1) {
        Meteor.call("unfollowError", user._id, errorID);
      }
      else {
        Meteor.call("followError", user._id, errorID);
      }
      event.target.blur();
    },
    "keydown .hintTextarea": function(event) {
      if (event.keyCode == 9) {
        event.preventDefault();
        submitObj = $("#errorID-"+this._id).find(".addHint");
        Session.set("tabSubmit",true);
        submitObj.focus();
      }
    }
  });
}



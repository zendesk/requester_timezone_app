(function() {

  return {
    events: {
      'app.activated'   :'getRequesterInfo',
      'userInfo.done'   :'setUserInfo',
      'userInfo.fail'   :'showError',
      'time_zones.done' :'setTimezone',
      'time_zones.fail' :'showError'
    },

    requests: {

      userInfo: function(id) {
        return {
          url: '/api/v2/users/' + id + '.json',
          type: 'GET',
          dataType: 'json'
        };
      },

      time_zones: function() {
        return {
          url: '/api/v2/time_zones.json',
          type: 'GET',
          dataType: 'json'
        };
      }
    },

    //helpers
    myLogger: function(msg) {
      var logging = false;
      if (logging) {
        console.log(msg);
      }
    },

    shortDateString: function(theDate) {
      return theDate.toString().replace( /:00 GMT(.+)$/, "");
    },

    getUserTZ: function(userTZ) {
      var result;
      this.myLogger("Looking for the timezone that matches " + userTZ);
      for (var index = 0; index < this.timezone.time_zones.length; index++) {
        if (this.timezone.time_zones[index].name == userTZ) {
          this.myLogger("Timezone found at index " + index);
          result = this.timezone.time_zones[index];
        }
      }
      return result;
    },

    whichModal: function() {
      if (this.requesterData.user.id == this.agentData.user.id) {
        this.whichModal = 'userIsRequester';
      } else {
        this.whichModal = 'meeting';
      }
    },

    getLocalTime: function(offset) {
      var result;
      this.myLogger("Getting the local time from offset " + offset);
      //convert offset in minutes to milliseconds
      var offsetMS = offset * 60 * 1000;
      var localtime = new Date(new Date().getTime() + offsetMS);
      result = localtime.toUTCString().replace( / GMT$/, "");
      this.myLogger("local:" + result);
      return result;
    },

    //start running the app here
    getRequesterInfo: function() {
      var requesterPromise = this.ajax('userInfo', this.ticket().requester().id());
      var agentPromise     = this.ajax('userInfo', this.currentUser().id());
      var timezonePromise  = this.ajax('time_zones');

      this.switchTo('loading');

      this.when(requesterPromise, agentPromise, timezonePromise).then(function() {
        this.myLogger("promises kept");
        this.whichModal();
        this.showInfo();
      }.bind(this));

      var id = this.ticket().requester().id();
      this.myLogger("The requester ID is " + id);
    },

    setRequesterInfo: function(userData) {
      this.myLogger("Setting requesterData");
      this.requesterData = userData;
      this.myLogger(this.requesterData);
      //now get the agent data
      this.getAgentInfo();
    },

    setUserInfo: function(userData) {
      this.switchTo('loading');
      this.myLogger("Setting requesterData");
      //in cases where the requester is the currentuser, set the userData for both
      if (!this.requesterData && (this.ticket().requester().id() == userData.user.id)) {
        this.myLogger("Found the requester");
        this.requesterData = userData;
      } else {
        this.myLogger("Found the Agent");
        this.agentData = userData;
      }
      if (this.requesterData && this.agentData) {
        this.ajax('time_zones');
      }
    },

    setTimezone: function(timezone) {
      this.myLogger("Setting the timezone object");
      this.myLogger(timezone);
      this.timezone = timezone;
    },

    //get hours 0-23 for the agents timezone and the corresponding requesters time
    populateTZTimes: function(agentOffset, requesterOffset) {
      var times = [];
      var now = new Date();
      var currentTime = new Date(now.getUTCFullYear(), now.getMonth(), now.getUTCDate(), null, null, null);
      var agentTime = currentTime;
      this.myLogger("Agent offset:" + agentOffset + " Requester offset:" + requesterOffset);
      var requesterModifier = (agentOffset/60) - (requesterOffset/60);
      //if the requester offset is less than the agent, we need to go back (ie - subtract)
      if (agentOffset > requesterOffset) { requesterModifier *= -1;}
      var requesterTime = new Date(currentTime.getTime() + (requesterModifier * 60 * 60 * 1000));
      for (var h=0; h<24; h++){
        times.push({agent: new Date(agentTime.getTime() + (3600000 * h)),
                    requester: new Date(requesterTime.getTime() + (3600000 * h))});
      }
      return times;
    },
   
    setUserTZData: function() {
      this.requesterTZ = this.getUserTZ(this.requesterData.user.time_zone);
      this.requesterTZ.localtime = this.getLocalTime(this.requesterTZ.offset);
      this.agentTZ = this.getUserTZ(this.agentData.user.time_zone);
      this.agentTZ.localtime = this.getLocalTime(this.agentTZ.offset);
    },

    showInfo: function() {
      this.myLogger(this.requesterData);
      this.setUserTZData();
      var meetingTimes = this.createMeetings();
      this.switchTo('main', {requesterData: this.requesterData, 
                             requesterTZ:   this.requesterTZ, 
                             agentData:     this.agentData,
                             whichModal:    this.whichModal,
                             meetingTimes:  meetingTimes});
    },

    createMeetings: function() {
      var times = this.populateTZTimes(this.agentTZ.offset, this.requesterTZ.offset);
      return _.map(times, function(hour, index) {
        var agentGood, requesterGood;
        var agentTime = hour.agent.getHours();
        var requesterTime = hour.requester.getHours();
        if (agentTime >= 9 && agentTime <= 17) agentGood = "goodtime";
        if (requesterTime >= 9 && requesterTime <= 17) requesterGood = "goodtime";
        return {agent: this.shortDateString(hour.agent),
                agentClass: agentGood,
                requester: this.shortDateString(hour.requester),
                requesterClass: requesterGood};
      }.bind(this));
    },

    showError: function() {
      this.switchTo('error');
    }

  };

}());

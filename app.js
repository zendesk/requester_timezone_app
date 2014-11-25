(function() {

  return {
    events: {
      'app.activated'     :'getRequesterInfo',
      'userInfo.done':'setUserInfo',
      'userInfo.fail':'showError',
      'time_zones.done'   :'setTimezone',
      'time_zones.fail'   :'showError',
      'shown #meeting'    :'handleShown',
      'hidden #meeting'   :'handleHidden'
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
      var logging = true;
      if (logging) {
        console.log(msg);
      }
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

    getLocalTime: function(offset) {
      var result;
      this.myLogger("Getting the local time from offset " + offset);
      //this.myLogger("UTC:" + (new Date().toUTCString()));
      //convert offset in minutes to milliseconds
      var offset_ms = offset * 60 * 1000;
      var localtime = new Date(new Date().getTime() + offset_ms);
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
      if (this.ticket().requester().id() == userData.user.id) {
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

    //show hours 0-23 offset for the user's TZ
    populateTZTimes: function(offset) {
      var times = [];
      var current_hour;
      var current_time;
      for (var h=0; h<24; h++){
        current_hour = h + (offset/60);
        if (current_hour < 0) {
          current_hour += 24;
        }
        if (current_hour > 24) {
          current_hour = current_hour % 24;
        }
        current_time = new Date(null, null, null, current_hour, null, null);
        times.push(current_time.toTimeString().substring(0,5));
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
      this.createMeetings();
      this.switchTo('main', {requesterData: this.requesterData, requesterTZ: this.requesterTZ});
    },

    createMeetings: function() {
      var times = this.$('#timestable');
      this.agentTZTimes = this.populateTZTimes(this.agentTZ.offset);
      this.requesterTZTimes = this.populateTZTimes(this.requesterTZ.offset);


      //for (var h=0; h<24; h++) {
        //times.append("<tr>");
        //times.append("<td>" + agentTZTimes[h] + "</td><td>" + requesterTZTimes[h] + "</td>");
        //times.append("</tr>");
      //}
    },

    handleHidden: function() {
      this.$('#timestable').html("");
    },

    showError: function() {
      this.switchTo('error');
    }

  };

}());

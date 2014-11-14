(function() {

  return {
    events: {
      'app.activated':'getUserInfo',
      'userInfo.done':'setUserInfo',
      'userInfo.fail':'showError',
      'time_zones.done':'setTimezone',
      'time_zones.fail':'showError',
      'shown #meeting' : 'handleShown',
      'hidden #meeting' : 'handleHidden'
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
      console.log(msg);
    },

    getRequestersTZ: function(userTZ) {
      this.myLogger("Looking for the timezone that matches " + userTZ);
      for (var index = 0; index < this.timezone.time_zones.length; index++) {
        if (this.timezone.time_zones[index].name == userTZ) {
          this.myLogger("Timezone found at index " + index);
          this.userTZ = this.timezone.time_zones[index];
        }
      }
    },

    getRequestersLocalTime: function(offset) {
      this.myLogger("Getting the local time from offset " + offset);
      this.myLogger("UTC:" + (new Date().toUTCString()));
      //convert offset in minutes to milliseconds
      var offset_ms = offset * 60 * 1000;
      var localtime = new Date(new Date().getTime() + offset_ms);
      this.userTZ.localtime = localtime.toUTCString().replace( / GMT$/, "");
      this.myLogger("local:" + this.userTZ.localtime);
    },


    //start running the app here
    getUserInfo: function() {
      this.switchTo('loading');
      var id = this.ticket().requester().id();
      this.myLogger("The requester ID is " + id);
      this.ajax('userInfo', id);
    },

    setUserInfo: function(userData) {
      this.myLogger("Setting userData");
      this.userData = userData;
      //now get the timezone data
      this.ajax('time_zones');
    },

    setTimezone: function(timezone) {
      this.myLogger("Setting the timezone object");
      this.myLogger(timezone);
      this.timezone = timezone;
      //now show the info
      this.showInfo();
    },

    showInfo: function() {
      this.myLogger(this.userData);
      this.getRequestersTZ(this.userData.user.time_zone);
      this.getRequestersLocalTime(this.userTZ.offset);
      this.switchTo('requester', {userData: this.userData, userTZ: this.userTZ});
    },

    handleShown: function() {
      var times = this.$('#timestable');
      for (var h=0; h<24; h++) {
        times.append("<tr>");
        times.append("<td>Hour " + h + "</td><td>Other hour " + h + "</td>");
        times.append("</tr>");
      }
    },

    handleHidden: function() {
      this.$('#timestable').html("");
    },

    showError: function() {
      this.switchTo('error');
    }

  };

}());

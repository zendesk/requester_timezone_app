(function() {

  return {
    events: {
      'app.activated':'getUserInfo',
      'userInfo.done':'setUserInfo',
      'userInfo.fail':'showError',
      'timezones.done':'setTimezone',
      'timezones.fail':'showError'
    },

    requests: {

      userInfo: function(id) {
        return {
          url: '/api/v2/users/' + id + '.json',
          type: 'GET',
          dataType: 'json'
        };
      },

      timezones: function() {
        return {
          url: '/api/v2/time_zones.json',
          type: 'GET',
          dataType: 'json'
        };
      }
    },

    myLogger: function(msg) {
      console.log(msg);
    },

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
      this.ajax('timezones');
    },

    setTimezone: function(timezone) {
      this.myLogger("Setting the timezone object");
      this.myLogger(timezone);
      this.timezone = timezone;
      //now show the info
      this.showInfo();
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
      var offsetMS = offset * 60 * 1000;
      var local = new Date(new Date().getTime() + offsetMS);
      this.userTZ.localtime = local.toUTCString().replace( / GMT$/, "");
      this.myLogger("local:" + this.userTZ.localtime);
    },

    showInfo: function() {
      this.myLogger(this.userData);
      this.getRequestersTZ(this.userData.user.time_zone);
      this.getRequestersLocalTime(this.userTZ.offset);
      this.switchTo('requester', {userData: this.userData, userTZ: this.userTZ});
    },

    showError: function() {
      this.switchTo('error');
    }

  };

}());

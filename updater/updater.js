
var OCUpdater = {
    bundlePath: '/bundles/',
    getQParam: function(name) {
        name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var regexS = "[\\?&]"+name+"=([^&#]*)";
        var regex = new RegExp( regexS );
        var results = regex.exec( window.location.href );
        if( results === null ) {
            return "";
        } else {
            return decodeURIComponent(results[1].replace(/\+/g, " "));
        }
    },

    init: function() {
        console.log('init');
        this.url = qParam('url');
        this.av = qParam('av');
        this.tok = qParam('tok');
        this.request(this.buildURL(this.bundlePath), this.onBundles, this);
    },
    
    onBundles: function(bundles) {
        console.log(bundles);
    },
    
    buildURL: function(path) {
      var url = this.url + path + '?callback=?';
        url += "&av=" + this.av;
        url += "&tok=" + this.tok;
        return url; 
    },
    
    request: function(url, callback, context) {
        console.log('request: ' + url);
        $.ajax({
          url: url,
          dataType: 'jsonp',
          success: callback,
          context: context
        });
    }
};

$(document).ready(function() {
    OCUpdater.init();
});
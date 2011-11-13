
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

    init: function(el) {
        //console.log('init');
        this.attachTo = el;
        this.url = this.getQParam('url');
        this.av = this.getQParam('av');
        this.tok = this.getQParam('tok');
        this.request(this.buildURL(this.bundlePath, 'list'), this.onBundles, this);
    },
    
    onBundles: function(bundles) {
        //console.log(bundles);
        var self = this;
        var body = $(self.attachTo);
        var guts = '<ul>';
        $.each(bundles.bundles, function() {
            //console.log(self);
            if (this.status != 'DEPRECATED') {
              var checked = this.status == 'INSTALL' || this.status == 'REQUIRED';
              // TODO: Use a JS template to build the checkbox instead of this
              // godawful mess.
              guts += '<li><input class="bundle" type="checkbox" name="' + this.name + '"';
              guts += ' id="bundle_' + this.name + '"';
              if (checked) {
                guts += " checked ";
              }
              if (this.status == 'REQUIRED') {
                guts += " disabled ";
              }
              guts += '/><label for="bundle_' + this.name + '">' + this.name + '</label></li>';
            }
        });
        guts += '</ul>';
        body.html(guts);
        $('.bundle').change({self: self}, self.onBundleClick);
    },

    onBundleClick: function(ev) {
        var self = ev.data.self;
        console.log($(this).val());
    },
    
    buildURL: function(path, extra) {
      var url = this.url + path + '?callback=?';
        url += "&av=" + this.av;
        url += "&tok=" + this.tok;
        if (extra) {
          // extra should be an object.
          // urlencode its values and tack it onto the query string.
        }
        return url; 
    },
    
    request: function(url, callback, context) {
        //console.log('request: ' + url);
        $.ajax({
          url: url,
          dataType: 'jsonp',
          success: callback,
          context: context
        });
    }
};

$(document).ready(function() {
    OCUpdater.init("#main");
});

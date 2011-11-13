
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

    init: function(config) {
        //console.log('init');
        this.config = config;
        this.url = this.getQParam('url');
        this.av = this.getQParam('av');
        this.tok = this.getQParam('tok');
        this.request(this.buildURL(this.bundlePath, 'list'), this.onBundles, this);
    },
    
    onBundles: function(bundles) {
        //console.log(bundles);
        var self = this;
        var body = $(self.config.container);
        var tmpl = $(this.config.tmplBundle);
        $.each(bundles.bundles, function() {
            //console.log(self);
            if (this.status != 'DEPRECATED') {
              this.install = this.status == 'INSTALL' || this.status == 'REQUIRED';
              this.required = this.status == 'REQUIRED';
              // set status to false if deprecated
              this.status = this.status == 'DEPRECATED' ? false : this.status;
            }
        });
        body.html(tmpl.mustache(bundles));
        $('.bundle').change({self: self}, self.onBundleClick);
    },

    onBundleClick: function(ev) {
        var self = ev.data.self;
        console.log(this.checked);
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
    OCUpdater.init({
        container: "#main",
        tmplBundle: "#tmpl_bundle" 
    });
});

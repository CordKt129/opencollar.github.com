
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
        this.config = config;
        this.url = this.getQParam('url');
        this.av = this.getQParam('av');
        this.tok = this.getQParam('tok');
        this.request(this.buildURL(this.bundlePath), this.onBundles, this);
    },
    
    onBundles: function(bundles) {
        var self = this;
        var body = $(self.config.container);
        var tmpl = $(self.config.tmplBundle);
        $.each(bundles.bundles, function() {
            if (this.status != 'DEPRECATED') {
              this.install = this.status == 'INSTALL' || this.status == 'REQUIRED';
              this.required = this.status == 'REQUIRED';
              // set status to false if deprecated
              this.status = this.status == 'DEPRECATED' ? false : this.status;
            }
        });
        body.html(tmpl.mustache(bundles));
        $(self.config.clsBundle).change({self: self}, self.onBundleClick);
        $(self.config.btnStart).click({self:self}, self.onStartClick);
    },

    onBundleClick: function(ev) {
        var self = ev.data.self;
        // phone home to prim and enable/disable item.
        var cmd = {};
        cmd[this.checked ? 'enable' : 'disable'] = this.name;
        var url = self.buildURL(self.bundlePath, cmd);
        self.request(url, self.onBundles, self);
    },

    onStartClick: function(ev) {
        var self = ev.data.self;
        var url = self.buildURL(self.bundlePath, {start: 1});
        self.request(url, self.onBundles, self);
    },
    
    buildURL: function(path, extra) {
      var url = this.url + path + '?callback=?';
        url += "&av=" + this.av;
        url += "&tok=" + this.tok;
        if (extra) {
          $.each(extra, function(key, value) {
              url += "&" + encodeURI(key) + "=" + encodeURI(value); 
          });
          // extra should be an object.
          // urlencode its values and tack it onto the query string.
        }
        return url; 
    },
    
    request: function(url, callback, context) {
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
        tmplBundle: "#tmpl_bundle",
        clsBundle: ".bundle",
        btnStart: "#start"
    });
});

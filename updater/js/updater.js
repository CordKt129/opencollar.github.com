try {
  window.hasLocalStorage = 'localStorage' in window && window.localStorage !== null;
} catch(e) {
  window.hasLocalStorage = false;
}


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
    
    onBundles: function(info) {
        var self = this;
        var body = $(self.config.container);
        var tmpl = $(self.config.tmplBundle);
        info.families = [];
        var firstname = self.splitWords(info.bundles[0].name);
        var lastfam = firstname.first ? firstname.first : firstname.last;
        var family = {name: lastfam, bundles: []};
        // set some flags on each bundle for controlling template logic
        $.each(info.bundles, function() {
          this.install = this.status == 'INSTALL' || this.status == 'REQUIRED';
          this.required = this.status == 'REQUIRED';
          // set status to false if deprecated
          this.status = this.status == 'DEPRECATED' ? false : this.status;
          var parts = self.splitWords(this.name);
          this.label = parts.last ? parts.last : parts.first;
          var thisfam = parts.first ? parts.first : parts.last;
          this.family = thisfam;
          if (thisfam != lastfam) {
            info.families.push(family);
            family = {name: thisfam, bundles: []};
          }
          family.bundles.push(this);

          lastfam = thisfam;
        });
        // write the content to the container
        body.html(tmpl.mustache(info));
        // bind a click handler to the checkboxes
        $(self.config.clsBundle).change({self: self}, self.onBundleClick);
        // bind a click handler to the start button
        $(self.config.btnStart).click({self:self}, self.onStartClick);

        // set the page title to the .name property in the response.
        $('title').text(info.name);
        
        // try to load the bundle choices from the last run, if found.
        if (window.hasLocalStorage && self.loaded === undefined) {
            var last_bundles = localStorage.getItem('bundles');
            if (last_bundles !== null) {
                var states = JSON.parse(last_bundles);
                $.each(states, function(idx) {
                    var el = $('#bundle_' + idx);
                    var remembered = states[idx] === true;
                    // if the remembered state is different from the current
                    // one, we'll have to tell the updater.
                    if (el.checked && !remembered) {
                        console.log(idx + " is checked but wasn't last time");
                        self.disableBundles([idx]);
                    } else if (!el.checked && remembered) {
                        console.log(idx + " is unchecked but was checked last time");
                        self.enableBundles([idx]);
                    }
                    el.prop('checked', remembered);
                });
            }
            self.loaded = true;
        }
    },

    onBundleClick: function(ev) {
        var self = ev.data.self;
        console.log(this);
        if (this.checked) {
            console.log('checked');
            var bundles = [this.name];
            // look if there's a parent bundle
            var dep = $(this).data('family') + 'Main';
            console.log(dep);
            if ($('#bundle_' + dep).length) {
                console.log('there is a parent');
                bundles.push(dep);
            }
            console.log(bundles);
            self.enableBundles(bundles);
        } else {
            // TODO: if disabling a *Main bundle, also disable any bundles that
            // depend on it.
            self.disableBundles([this.name]);
        }
    },

    enableBundles: function(bundles) {
        var self = this;
        self._setBundlesState('enable', bundles);
    },
    
    disableBundles: function(bundles) {
        var self = this;
        self._setBundlesState('disable', bundles);
    },

    _setBundlesState: function(state, bundles) {
        var self = this;
        // phone home to prim and enable/disable item.
        var cmd = {};
        cmd[state] = bundles.join('~');
        // if box is checked, look for a "Main" bundle in the same family.  
        // If found, enable that too.
        var url = self.buildURL(self.bundlePath, cmd);
        console.log(url);
        self.request(url, self.onBundles, self);

    },

    onStartClick: function(ev) {
        var self = ev.data.self;
        var url = self.buildURL(self.bundlePath, {start: 1});
        self.request(url, self.onBundles, self);

        // store the selected bundles in localStorage, if possible.
        if (window.hasLocalStorage) {
            // we want to remember both what's checked, and what's unchecked.
            // So the best thing is to save the state of every checkbox on the
            // page.
            var checkboxes = $('input[type=checkbox][disabled!=disabled]');
            var states = {};
            checkboxes.each(function (idx) {
                states[$(checkboxes[idx]).attr('name')] = checkboxes[idx].checked;
            });
            localStorage.setItem('bundles', JSON.stringify(states));
        }
    },

    splitWords: function(word) {
        // find the last uppercase letter in the word and split there.  Return
        // an object with 'first' and 'last' elements.  If no uppercase letter
        // found, then it's all last. Same result if the only uppercase letter
        // is at the beginning of the word.
        for (var i = word.length - 1; i >= 0; i--) {
            var l = word.substring(i, i + 1);
            if (l == l.toUpperCase()) {
                // l is an uppercase letter.  This is our split point.
                return {first: word.substring(0, i), last: word.substring(i, word.length)};
            }
        }
        return {first: '', last: word};
    },
    
    buildURL: function(path, extra) {
      var url = this.url + path + '?callback=?';
        url += "&av=" + this.av;
        url += "&tok=" + this.tok;
        if (extra) {
          // extra should be an object.
          // urlencode its values and tack it onto the query string.
          // encodeURI will preseve tildes (~), which the LSL script uses to delimit
          // the bundle list if you're marking more than one bundle for
          // installation/uninstallation at once.
          $.each(extra, function(key, value) {
              url += "&" + encodeURI(key) + "=" + encodeURI(value); 
          });
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

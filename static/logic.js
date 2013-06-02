(function() {

$.ajaxSetup({cache: false});

var cache = {}
var html5 = !!window.history.pushState;

function onHashchange(e, callback) {
    getFactoid(location.hash.substr(2), function(data) {
        loadFactoid(data);
        if (callback) {
            callback();
        }
    });
}

$(function() {
    if (html5) {
        // Check that link isn't from IE
        if (location.hash !== "") {
            onHashchange(null, function() {
                $("#body").css('visibility', '');
            });
            window.slug = location.hash.substr(2);
        } else {
            $("#body").css('visibility', '');
        }
        
        history.replaceState({}, "", window.slug);
        
        $(window).on('popstate', function(e) {
            if (e.originalEvent.state == null) {
                return; // page load
            }

            getFactoid(location.pathname.substr(1), function(data) {
                loadFactoid(data);
                setTimeout(function(){
                    $("#body").css('visibility', '');
                }, 200);
            });
        });
    } else if (location.hash.substr(2) === "") {
        location.href = "#/" + window.slug;
    }
    
    if (!html5) {
        onHashchange(null, function() {
            setTimeout(function(){
                $("#body").css('visibility', '');
                $(window).on('hashchange', onHashchange);
            }, 200);
        });
    }

});

function saveFactoid(data) {
    cache[data.slug] = data;
    if (window.localStorage && window.JSON) {
        localStorage.setItem(data.slug, JSON.stringify(data));
    }
}

function getFactoid(slug, callback) {
    if (cache[slug]) {
        callback(cache[slug]);
        return;
    }
    
    if (window.localStorage && window.JSON) {
        var val = localStorage.getItem(slug);
        if (val) {
            val = JSON.parse(val);
            cache[slug] = val;
            callback(val);
            return;
        }
    }
    
    // else
    $.get("/" + slug + ".json", function(data) {
        if (!data.error) {
            saveFactoid(data);
        }
        callback(data);
    });
}

function loadFactoid(data) {
    window.slug = data.slug;
    $("#body").fadeOut(200);
    setTimeout(function() {
        $("#more_content").hide();
        $("#button").removeAttr('href').html("");
    
        $("#content").empty().append(data.content.split("\n").join("<br>"));
        setTweetButton()

        $("#source").attr("href", data.source_url).html(data.source_text);
    
        if (data.more_content) {
            $("#read-more").parent().css('display', 'inline-block');
            $("#more_content").empty().append(
                $("<p>" + data.more_content.split("\n").join("</p><p>") + "</p>")
            );
        } else {
            $("#more_content").empty().hide();
            $("#read-more").parent().hide();
        }
        
        if (data.button_text && data.button_url) {
            $("#button").attr('href', data.button_url).html(data.button_text);
            !data.more_content ? $("#more_button").css('display', 'inline-block') : $("#more_button").hide();
        } else {
            $("#button").removeAttr('href').html('');
            $("#more_button").hide();
        }
    }, 200);
    $("#body").fadeIn(200);
}

$(function() {
    
    $("#read-more").click(function() {
      $("#read-more").parent().fadeOut(200);
      $("#more_content").slideDown(200);
      var btn = $("#button");
      if (btn.text() != "") {
        btn.fadeIn(200);
      }
    });
    
    if (window.JSON) { // IE7 gets a force load
        $("#next-fact, #header a").click(function(e) {
            e.preventDefault();
            $.get("/random.json", function(data) {
                if (!data.error) {
                    saveFactoid(data);
                }
    
                if (html5) {
                    history.pushState({}, "", data.slug);
                    loadFactoid(data);
                } else {
                    location.href = "#/" + data.slug;
                }
            });
        });
    }
    $("#about-button").click(function(e) {
        e.preventDefault();
        $("#about-this-site").toggle();
    });
    $("#hot-pink-time").click(hotPinkTimeOn);
});

$(window).on('load', function() {
    setTweetButton();
});

var hotPinkTime = false;
var interval = null;

function generateTweetButton(urlSlug) {
    var content = $("#content").text(),
        url = location.protocol + "//" + location.host + "/" + urlSlug,
        hashtag = "#copywrong",
        ellipsis = "…",
        urlLength = 21,
        availableSpace = 140 - urlLength - hashtag.length - 3;

    if (content.length > availableSpace) {
        content = content.substring(0, availableSpace - 1) + ellipsis;
    }

    try {
      twttr.widgets.createHashtagButton("copywrong", $("#twitter")[0], {
          text: content + " " + url,
          dnt: true,
          related: "Aus_Digital"
      });
    } catch(e) {}
}

function setTweetButton() {
    $("#twitter").empty();
    generateTweetButton(window.slug);
}

function hotPinkTimeOn(e) {
    e.preventDefault();
    interval = setInterval(function() {
        $("#content").css({
            'position': 'relative',
            'color': hotPinkTime ? 'black' : '#e75722',
            'left': parseInt(Math.random() * 40) - 20,
            'top': parseInt(Math.random() * 40) - 20,
            'transform': 'rotate(' + (parseInt(Math.random() * 10) - 5) + 'deg)'
        });
        hotPinkTime = !hotPinkTime;
    }, 100);
    
    $("#hot-pink-time").css('color', '#e75722')
        .off('click').click(hotPinkTimeOff);
}

function hotPinkTimeOff(e) {
    e.preventDefault();
    clearInterval(interval);
    hotPinkTime = false;
    $("#content").css({
        'position': 'static',
        'color': '',
        'left': '',
        'top': '',
        'transform': ''
    });
    
    $("#hot-pink-time").css('color', '')
        .off('click').click(hotPinkTimeOn);
}

})();

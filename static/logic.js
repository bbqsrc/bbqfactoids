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
    $("#body").fadeOut(200);
    setTimeout(function() {
        $("#more_content").hide();
    
        $("#content").empty().append(data.content.split("\n").join("<br>"));

        $("#source").attr("href", data.source_url).html(data.source_text);
    
        if (data.more_content) {
            $("#read-more").parent().css('display', 'inline-block');
            $("#more_content").empty().append(
                $("<p id='more_content'>" + data.more_content.split("\n").join("</p><p>") + "</p>")
            );
        } else {
            $("#more_content").empty().hide();
            $("#read-more").parent().hide();
        }
        
        if (data.button_text && data.button_url) {
            $("#button").attr('href', data.button_url).html(data.button_text);
        }
    
        if (data.button_text && data.button_url && !data.more_content) {
            $("#more_button").css('display', 'inline-block');
        } else {
            $("#more_button").hide();
        }
    }, 200);
    $("#body").fadeIn(200);
    $("#next-fact").removeAttr('disabled');
}

$(function() {
    $("#read-more").click(function() {
      $("#read-more").parent().fadeOut(200);
      $("#more_content").slideDown(200);
      var btn = $("#more_button");
      if (btn.text() != "") {
        btn.fadeIn(200);
      }
    });
    
    if (window.JSON) { // IE7 gets a force load
        $("#next-fact, #header a").click(function(e) {
            $(this).attr('disabled', true);
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

    $("#hot-pink-time").click(function(e) {
        e.preventDefault();
        $(this).css('color', 'fuchsia')
            .off('click');

        var pink = false;

        setInterval(function() {
            $("#content").css({
                'position': 'relative',
                'color': pink ? 'black' : 'fuchsia',
                'left': parseInt(Math.random() * 40) - 20,
                'top': parseInt(Math.random() * 40) - 20,
                'transform': 'rotate(' + (parseInt(Math.random() * 10) - 5) + 'deg)'
            });
            pink = !pink;
        }, 100);
    });
});


})();

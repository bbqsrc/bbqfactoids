(function() {

$.ajaxSetup({cache: false});

var cache = {}
var html5 = !!window.history.pushState;
var firstHashTrigger = false;

function onHashchange(e, callback) {
    if (firstHashTrigger) {
        firstHashTrigger = false;
        return;
    }
    getFactoid(location.hash.substr(2), function(data) {
        loadFactoid(data);
        if (callback) {
            callback();
        }
    });
}

$(function() {
    if (!html5) {
        $(window).on('hashchange', onHashchange);
    }

    if (html5) {
        // Check that link isn't from IE
        firstHashTrigger = true;
        
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
            if (firstHashTrigger) {
                firstHashTrigger = false;
                return;
            }
            getFactoid(location.pathname.substr(1), function(data) {
                loadFactoid(data);
                setTimeout(function(){
                    $("#body").css('visibility', '');
                }, 200);
            });
        });
    } else if (location.hash === "") {
        location.href = "#/" + window.slug;
        firstHashTrigger = true;
        $("#body").css('visibility', '');
    } else {
        onHashchange(null, function() {
            setTimeout(function(){
                $("#body").css('visibility', '');
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

    $("#content").replaceWith(
        $("<p id='content'>" + data.content.split("\n").join("</p><p>") + 
            " [<a href='"+ data.source_url +"'>"+ data.source_text +"</a>]</p>")
    );

    if (data.more_content) {
        $("#read-more").parent().show();
        $("#more_content").empty().append(
            $("<p id='more_content'>" + data.more_content.split("\n").join("</p><p>") + "</p>")
        );
    } else {
        $("#more_content").empty().hide();
        $("#read-more").parent().hide();
    }

    if (data.button_text && data.button_url && !data.more_content) {
        $("#button").attr('href', data.button_url).html(data.button_text);
        $("#more_button").show();
    } else {
        $("#more_button").hide();
    }
    }, 200);
    $("#body").fadeIn(200);
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

    $("#next-fact").click(function(e) {
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
});

})();

(function() {

var cache = {}
var html5 = !!window.history;
var firstHashTrigger = false;

$(window).on('hashchange', function(e) {
    if (firstHashTrigger) {
        firstHashTrigger = false;
        return;
    }
    console.log(location.hash, e);
    getFactoid(location.hash.substr(2), function(data) {
        loadFactoid(data);
    });
});

(function() {
    if (html5) {
        // Check that link isn't from IE
        if (location.hash !== "") {
            $(window).trigger('hashchange');
            window.slug = location.hash.substr(2);
        }
        
        history.replaceState({}, "", window.slug);
        $(window).on('popstate', function(e) {
            console.log(e, location.pathname);
            getFactoid(location.pathname.substr(1), function(data) {
                loadFactoid(data);
            });
        });
    } else if (location.hash === "") {
        location.href = "#/" + window.slug;
        firstHashTrigger = true;
    }
})();

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

    console.log(data.slug);
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

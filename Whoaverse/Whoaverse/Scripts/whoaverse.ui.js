﻿//Whoaverse UI JS framework - Version 0.1 - 11/13/2014
//Tested only with the latest version of IE, FF, & Chrome

var UI = window.UI || {};

//Generic handler for User defined event notifications
UI.Notifications = (function () {
    //private
    var _subscribers = [];

    function notify(event, context) {
        _subscribers.forEach(function (x) {
            if (x.event == event) {
                x.callback(context);
            }
        });
    }

    return {
        //public
        subscribe: function (event, callback) {
            _subscribers.push({ "event": event, "callback": callback });
        },
        unSubscribe: function (event, callback) {
            _subscribers = _subscribers.filter(function (x) {
                if (!(x.event == event && x.callback == callback)) {
                    return x;
                }
            });
        },
        clear: function (event) {
            _subscribers = _subscribers.filter(function (x) {
                if (x.event !== event) {
                    return x;
                }
            });
        },
        raise: function (event, context) {
            notify(event, context);
        }
    }
})();

UI.Common = {
    isMobile: function () {
        return false; //TODO: determine what conditions qualify for a "mobile" view
    },
    isCommentPage: function () {
        return /\/comments\//i.test(window.location.href);
    }
}

UI.LinkHandler = {
    //This will be the object that converts /u/name -> <a href='/user/name'>/u/name</a> and /v/sub -> <a href='/v/sub'>/v/sub</a>
}

UI.CommentImageHandler = (function () {

    UI.Notifications.subscribe("DOM", function (context) {
        UI.CommentImageHandler.execute(context);
    });

    function load(target, autoLoading) {


        var anchorText = target.text();

        if (UI.CommentImageHandlerSettings.onLoading) {
            UI.CommentImageHandlerSettings.onLoading(target, target.text());
        }
        
        var img = new Image();
        img.onload = function () {

            if (!this.complete) {
                return;
            }
            
            var parent = target.parent();

            var displayDiv = $('<div/>', {
                class: 'async-img',
                style: 'display:none;'
            }).insertAfter(target);

            var i = $(this);

            displayDiv.html(i);

            //BEGIN: Evil sizing code because IE is *special*
            var width, height;
            if (this.naturalWidth) {
                width = this.naturalWidth;
            } else {
                width = this.width;
            }
            if (this.naturalHeight) {
                height = this.naturalHeight;
            } else {
                height = this.height;
            }

            //I HAVE NO IDEA WHY I HAVE TO DO THIS TO REMOVE THE width/height attributes of the image tag itself
            i.css('width', width);
            i.css('height', height);
            this.removeAttribute("width");
            this.removeAttribute("height");

            if (width > UI.CommentImageHandlerSettings.maxSize || height > UI.CommentImageHandlerSettings.maxSize) {
                if (width >= height) {
                    i.css("width", UI.CommentImageHandlerSettings.maxSize);
                    i.css("height", "auto");

                    i.data("origWidth", UI.CommentImageHandlerSettings.maxSize);
                    i.data("origHeight", "auto");

                } else {
                    i.css("width", "auto");
                    i.css("height", UI.CommentImageHandlerSettings.maxSize);

                    i.data("origWidth", "auto");
                    i.data("origHeight", UI.CommentImageHandlerSettings.maxSize);
                }
                i.data("inFullMode", false);

                displayDiv.click(function () {
                    var childImg = $(this).children("img");
                    if (childImg.data('inFullMode')) {
                        childImg.css("width", childImg.data('origWidth'));
                        childImg.css("height", childImg.data('origHeight'));
                        childImg.data('inFullMode', false);
                    } else {
                        childImg.css("width", "auto");
                        childImg.css("height", "auto");
                        childImg.data('inFullMode', true);
                    }
                });
                displayDiv.css('cursor', 'pointer');
            }

            target.data("loaded", true);

            if (UI.CommentImageHandlerSettings.onLoaded) {
                UI.CommentImageHandlerSettings.onLoaded(target, anchorText);
            }

            if (!autoLoading) {
                target.data("showing", true);
                UI.CommentImageHandlerSettings.toggleFunction(displayDiv, true);
            }
        };
        img.src = target.attr("href");
    }


    return {

        bind: function (element) {

            
            $(element).data("showing", false);

            //this will be fixed later - the ajax nodes were getting hooked multiple times and I just haven't isolated this yet so lets just set a flag for if this element has been hooked before.
            if ($(element).data("hooked") == true) {
                return;
            }

            $(element).click(function (event) {
                event.preventDefault();

                var target = $(this);

                if (!target.data("showing")) {
                    //show
                    if (target.data("loaded")) {
                        target.data("showing", true);
                        UI.CommentImageHandlerSettings.toggleFunction(target.next(), true);
                    } else {
                        //load
                        load(target, false);
                    }
                } else {
                    //hide
                    UI.CommentImageHandlerSettings.toggleFunction(target.next(), false);
                    target.data("showing", false);
                }
            });
            
            $(element).data("hooked", true);
            

            if (UI.CommentImageHandlerSettings.autoLoad) {
                load($(element), true);
            }

            if (UI.CommentImageHandlerSettings.autoShow) {
               $(element).click();
            }
        },

        execute: function (container) {
            //no need to process if not on comments page
            if (!UI.Common.isCommentPage()) {
                return;
            }

            var settings = UI.CommentImageHandlerSettings;
            var c = (container == undefined ? $(settings.selector) : $(settings.selector, container));

            c.filter(function () { return settings.filter.test(this.href) }).each(function (i, x) {
                UI.CommentImageHandler.bind(x);
            });
        }
    }
})();

//Singleton Settings Object Closure based
UI.CommentImageHandlerSettings = (function () {
    return {
        autoLoad: true, //this setting will preload all image links
        autoShow: false, //if true then the click routine is run during event hookup
        selector: ".usertext-body > .md a", //elements to find image anchor tags
        filter: /(.png$|.jpg$|.jpeg$|.gif$|.giff$)/i, //regex for href links to load
        maxSize: 250,
        toggleFunction: function (element, display) { //element (obj) to show/hide, display (bool) show/hide
            element.slideToggle();
        },
        onLoading: function (element, rawText) {
            element.text(rawText + " (loading)");
        },
        onLoaded: function (element, rawText) {
            element.text(rawText + " (img)");
        },
        //TODO: Settings that need implemented
        maxFileSizeInKB: 2048
    }
})();


$(document).ready(function () {
    //UI.CommentImageHandlerSettings.autoShow = false;
    UI.CommentImageHandler.execute();
});








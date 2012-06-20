/*jslint browser: true, sloppy: true */
/*global jQuery, $, Symfony, Routing, console */
/* =============================================================
 * Copyright 2012 Jazzy Innovations, sp. z o.o.
 * Created by Seweryn Zeman <seweryn.zeman@jazzy.pro>
 * ========================================================== */

Symfony = {};
Symfony.stepChanger = {};

Symfony.stepChanger.slideSpeed = 300;
Symfony.stepChanger.form = null;
Symfony.stepChanger.validationMethod = null;
Symfony.stepChanger.onStepChangeListener = null;

/**
 * Initialize module.
 *
 * @author Seweryn Zeman <seweryn.zeman@jazzy.pro>
 */
Symfony.stepChanger.init = function (form, validationMethod, onStepChangeListener) {
    Symfony.stepChanger.form = form;
    Symfony.stepChanger.validationMethod = validationMethod;
    Symfony.stepChanger.onStepChangeListener = onStepChangeListener;
    window.location.hash = "1";
    // set step as first
    Symfony.stepChanger.setActiveStep(1, 1);
    // hash handler
    Symfony.stepChanger.handleHashChange();
    // bind Next as next
    Symfony.stepChanger.bindNextButtonDefaultAction();
};

/**
 * Count number of steps.
 *
 * @author Seweryn Zeman <seweryn.zeman@jazzy.pro>
 */
Symfony.stepChanger.countSteps = function (element) {
    return $(".breadcrumb li").size();
};

/**
 * Set step as filled.
 *
 * @author Seweryn Zeman <seweryn.zeman@jazzy.pro>
 */
Symfony.stepChanger.setFilled = function (element) {
    $(".breadcrumb li:nth-of-type(" + element + ")").addClass("filled");
};

/**
 * Set step as not filled. For ex. if backwards validation failed.
 * Step(s) can be provided as "3+n" - that means elements 3-5 will be set as unfilled.
 *
 * @author Seweryn Zeman <seweryn.zeman@jazzy.pro>
 */
Symfony.stepChanger.unsetFilled = function (element) {
    $(".breadcrumb li:nth-of-type(" + element + ")").removeClass("filled");
};

/**
 * Set step as active (current).
 *
 * @author Seweryn Zeman <seweryn.zeman@jazzy.pro>
 */
Symfony.stepChanger.setActiveStep = function (from, to) {
    $(".breadcrumb li:nth-of-type(" + from + ")").removeClass("active");
    $(".breadcrumb li:nth-of-type(" + to + ")").addClass("active");
};

/**
 * Get current active step.
 *
 * @author Seweryn Zeman <seweryn.zeman@jazzy.pro>
 */
Symfony.stepChanger.getActiveStep = function () {
    return parseInt($(".breadcrumb li.active").index() + 1, 0);
};

/**
 * Perform going to next step.
 *
 * @author Seweryn Zeman <seweryn.zeman@jazzy.pro>
 */
Symfony.stepChanger.goToNextStep = function () {
    var active = Symfony.stepChanger.getActiveStep(), destination = active + 1;
    // if form is valid
    if (Symfony.stepChanger.validationMethod()) {
        Symfony.stepChanger.onStepChangeListener(active, destination);
        // set step as filled
        Symfony.stepChanger.setFilled(active);
        if (active > 0 && active < Symfony.stepChanger.countSteps()) {
            Symfony.stepChanger.slideLeft(active, destination);
        }
        // check for Next button text
        setTimeout(function () {
            $("button#next").off("click");
            Symfony.stepChanger.checkNextButtonAction(destination);
        }, Symfony.stepChanger.slideSpeed + 100);
        window.location.hash = destination;
    }
};

/**
 * Handle changing hash - for ex. on breadcrumb.
 *
 * @author Seweryn Zeman <seweryn.zeman@jazzy.pro>
 */
Symfony.stepChanger.handleHashChange = function () {
    // onHashChange for handling breadcrump clicks
    $(window).hashchange(function () {
        var active = Symfony.stepChanger.getActiveStep(), destination = parseInt(location.hash.substring(1), 0);
        if (active === 1 && isNaN(destination)) {
            history.go(-1);
            return;
        }
        // prevent from manual inputing hash step number
        if (active !== 0 && active !== destination) {
            Symfony.stepChanger.validationMethod();
            if (active === (Symfony.stepChanger.countSteps() - 1) && (!Symfony.stepChanger.validationMethod())) {
                //window.location.hash = active;
                history.go(-1);
                return;
            }
            if (destination === active + 1) {
                Symfony.stepChanger.goToNextStep();
            } else if (destination !== 0 && (destination === 1 || destination < active || $(".breadcrumb li:nth-child(" + destination + ")").hasClass("filled") || $(".breadcrumb li:nth-child(" + (destination - 1) + ")").hasClass("filled"))) {
                Symfony.stepChanger.onStepChangeListener(active, destination);
                if (active < destination) {
                    Symfony.stepChanger.slideLeft(active, destination);
                } else if (active > destination) {
                    Symfony.stepChanger.slideRight(active, destination);
                }
                // hide all strange non-hiding error labels
                $('label.validationError').remove();
                setTimeout(function () {
                    $("button#next").off("click");
                    Symfony.stepChanger.checkNextButtonAction(destination);
                }, Symfony.stepChanger.slideSpeed + 100);
            } else {
                history.go(-1);
                //window.location.hash = active;
                return;
            }
        }
    });
};

/**
 * Bind default action to Next button. In this case - go to next step.
 *
 * @author Seweryn Zeman <seweryn.zeman@jazzy.pro>
 */
Symfony.stepChanger.bindNextButtonDefaultAction = function () {
    $("button#next").off("click");
    $("button#next").click(function () {
        Symfony.stepChanger.goToNextStep();
    });
};

/**
 * Bind save action to Next button. In this case - submit form.
 *
 * @author Seweryn Zeman <seweryn.zeman@jazzy.pro>
 */
Symfony.stepChanger.bindNextButtonSubmitAction = function () {
    $("button#next").off("click");
    $("button#next").click(function () {
        if (!$('#validation-errors').text()) {
            // disable multiple send if form is valid and already submitting in progress
            if (Symfony.stepChanger.validationMethod()) {
                $(Symfony.stepChanger.form).submit();
                $("button#next").off("click");
                $('button#next').click(function (e) {
                    e.preventDefault();
                    return false;
                });
            }
        } else {
            $("button#next").attr('disabled', 'disabled');
        }
    });
};

/**
 * Check what next button suppose to do.
 *
 * @author Seweryn Zeman <seweryn.zeman@jazzy.pro>
 */
Symfony.stepChanger.checkNextButtonAction = function (destination) {
    if (destination === Symfony.stepChanger.countSteps()) {
        $("button#next").text("Save");
        Symfony.stepChanger.bindNextButtonSubmitAction();
    } else {
        $("button#next").text("Continue");
        $("button#next").removeAttr('disabled');
        Symfony.stepChanger.bindNextButtonDefaultAction();
    }
};

/**
 * Slide from step to step - sliding from right TO LEFT side.
 *
 * @author Seweryn Zeman <seweryn.zeman@jazzy.pro>
 */
Symfony.stepChanger.slideLeft = function (from, to) {

    // disable clicking for slide time
    $(".breadcrumb").click(function () {
        return false;
    });
    $("button#next").off("click");
    $("button#next").click(function () {
        return false;
    });

    $("div#step-" + from).css("left", "0");
    $("div#step-" + to).css("left", "940px"); // TODO
    $("div#step-footer").animate({
        "opacity": "hide"
    });
    $("div#step-" + from).animate({
        "opacity": "hide",
        "left": "-940px" // TODO
    }, Symfony.stepChanger.slideSpeed, "linear", function () {
        $("div#step-" + to).animate({
            "opacity": "show",
            "left": "0"
        }, Symfony.stepChanger.slideSpeed);
        $("div#step-footer").animate({
            "opacity": "show"
        });
    });

    setTimeout(function () {
        $(".breadcrumb").off("click");
    }, Symfony.stepChanger.slideSpeed + 100);

    Symfony.stepChanger.setActiveStep(from, to);

};

/**
 * Slide from step to step - sliding from left TO RIGHT side.
 *
 * @author Seweryn Zeman <seweryn.zeman@jazzy.pro>
 */
Symfony.stepChanger.slideRight = function (from, to) {

    // disable clicking for slide time
    $(".breadcrumb").click(function () {
        return false;
    });
    $("button#next").off("click");
    $("button#next").click(function () {
        return false;
    });

    $("div#step-" + from).css("left", "0");
    $("div#step-" + to).css("left", "-940px"); // TODO
    $("div#step-footer").animate({
        "opacity": "hide"
    });
    $("div#step-" + from).animate({
        "opacity": "hide",
        "left": "940px" // TODO
    }, Symfony.stepChanger.slideSpeed, "linear", function () {
        $("div#step-" + to).animate({
            "opacity": "show",
            "left": "0"
        }, Symfony.stepChanger.slideSpeed);
        $("div#step-footer").animate({
            "opacity": "show"
        });
    });

    setTimeout(function () {
        $(".breadcrumb").off("click");
    }, Symfony.stepChanger.slideSpeed + 100);

    Symfony.stepChanger.setActiveStep(from, to);

};
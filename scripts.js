$(document).ready(function() {
    Symfony.stepChanger.init(
        "div#steps",
        function () { return true; },
        function () {}
    );
});
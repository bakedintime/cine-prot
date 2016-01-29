var interval = function(func, wait, times){
    var interv = function(w, t){
        return function(){
            if(typeof t === "undefined" || t-- > 0){
                setTimeout(interv, w);
                try{
                    func.call(null);
                }
                catch(e){
                    t = 0;
                    throw e.toString();
                }
            }
        };
    }(wait, times);

    setTimeout(interv, wait);
};

var votacionCard = $.templates("#votacion-card");

// Closes the sidebar menu
$("#menu-close").click(function(e) {
    e.preventDefault();
    $("#sidebar-wrapper").toggleClass("active");
});

// Opens the sidebar menu
$("#menu-toggle").click(function(e) {
    e.preventDefault();
    $("#sidebar-wrapper").toggleClass("active");
});

// Scrolls to the selected menu item on the page
$(function() {
    /*$('a[href*=#]:not([href=#])').click(function() {
        if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') || location.hostname == this.hostname) {

            var target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
            if (target.length) {
                $('html,body').animate({
                    scrollTop: target.offset().top
                }, 1000);
                return false;
            }
        }
    });*/

    // render votaciones
    var votaciones = [
        {
            fechaPelicula: '01/06/2016',
            mensaje: 'Vota ya!',
            open: true
        },
        {
            fechaPelicula: '08/06/2016',
            mensaje: 'Ya hay resultados',
            open: false
        }
    ];
    var rHtml = votacionCard.render(votaciones);
    $('#votaciones-cards').html(rHtml);

    interval(function(){
        $('#header-icon').addClass('animated fadeOut');
        var headerIcon = parseInt($('#header-icon').attr('src').split('-')[1].substr(4, 1), 10);
        var currentIndex = ((headerIcon >= 4) ? 1 : headerIcon + 1);
        $('#header-icon').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
            $('#header-icon').removeClass('animated fadeOut');
            $('#header-icon').attr('src', 'img/header-icon'+currentIndex+'.png');
            $('#header-icon').addClass('animated fadeIn');
            $('#header-icon').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
                $('#header-icon').removeClass('animated fadeIn');
            });
        });
    }, 3500);
});
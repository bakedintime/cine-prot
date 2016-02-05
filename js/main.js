var prefixAnimations = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
var votacionCard = $.templates("#votacion-card");
var detalleVotacionCard = $.templates("#detalle-votacion-card");
var basil = new window.Basil({
    namespace: 'cinetir',
    storages: ['cookie', 'local'],
    expireDays: 800
});

var initHello = function(){
    hello.init({
        google: '123591056896-tm74unsnde8elshnokbcvb6ujhblj8h7.apps.googleusercontent.com'
    }, {
        redirect_uri: 'templates/redirect.html'
    });
};

var showNotification = function(type, message, layout){
    var n = noty({
        text        : message,
        type        : type,
        dismissQueue: true,
        layout      : layout,
        theme       : 'relax',
        closeWith   : ['button', 'click'],
        maxVisible  : 10
    });
};

var checkAuthentication = function(){
    if (basil.get('auth-id') !== null){
        return true;
    }else{
        return false;
    }
};

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

var hideMainView = function(){
    $('.main-view').addClass('animated fadeOutUp');
    $('.main-view').one(prefixAnimations, function(){
        $('.main-view').removeClass('animated fadeOutUp');
        $('.detail-view').show();
        $('.main-view').hide();
        $('.detail-view').addClass('animated slideInDown');
        $('.detail-view').one(prefixAnimations, function(){
            $('.detail-view').removeClass('animated slideInDown');
            // if user not logged in dimm content and show log in with 
            // google 
            if (!checkAuthentication()){
                $('#detalle').addClass('blurring');
                $('#detalle-votacion-cards').addClass('dimmer inverted');
            }else{
                $('#detalle').removeClass('blurring');
                $('#detalle-votacion-cards').removeClass('dimmer inverted');
            }
        });
    });
    return false;
};

var hideDetailView = function(){
    $('.detail-view').addClass('animated fadeOutUp');
    $('.detail-view').one(prefixAnimations, function(){
        $('.detail-view').removeClass('animated fadeOutUp');
        $('.main-view').show();
        $('.detail-view').hide();
        $('.main-view').addClass('animated slideInDown');
        $('.main-view').one(prefixAnimations, function(){
            $('.main-view').removeClass('animated slideInDown');
        });
    });
};

var vote = function(idPelicula){
    var btn = this;
    $('.ui.toggle.button.active').text('Votar');
    $('.ui.toggle.button.active').removeClass('active');
    $(this).addClass('active');
    $('.send-vote-action').attr('data-selected-id', idPelicula);
    return false;
};

var getVotacion = function(id){
    var votacion = {
        idVotacion: 1,
        fechaPelicula: '01/06/2016',
        mensaje: 'Vota ya!',
        opciones: [
            {
                idPelicula: 5,
                nombre: "Mov1",
                link: "http://www.google.com",
                imagen: "http://placehold.it/150x150",
                duracion: "111",
                genero: "Acción",
                descripcion: "Pelicula agradable",
                votos: 14
            },
            {
                idPelicula: 6,
                nombre: "Mov2",
                link: "http://www.google.com",
                imagen: "http://placehold.it/150x150",
                duracion: "111",
                genero: "Acción",
                descripcion: "Pelicula clásica",
                votos: 50
            },
            {
                idPelicula: 7,
                nombre: "Mov3",
                link: "http://www.google.com",
                imagen: "http://placehold.it/150x150",
                duracion: "111",
                genero: "Acción",
                descripcion: "Pelicula nueva",
                votos: 36
            }
        ],
        ganador: 2,
        totalVotos: 100,
        open: true
    };
    return votacion;
};

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
    initHello();
    hello.on('auth.login', function(auth) {

        // Call user information, for the given network
        hello(auth.network).api('/me').then(function(r) {
            // Inject it into the container
            console.log('result from oauth callback', auth, r);
            basil.set('auth-id', {
                name: r.name,
                thumbnail: r.thumbnail,
                votedFilms: []
            });
        });
    });
    $('body').delegate('.vote-action', 'click', function(){
        var id = $(this).attr("data-index");
        var votacion = getVotacion(id);
        var rHtml = detalleVotacionCard.render(
            votacion,
            {
                hasVoted: function(idPelicula){
                    if (basil.get('auth-id') === null){
                        return false;
                    }
                    var votedFilms = basil.get('auth-id').votedFilms;
                    if (votedFilms.indexOf(idPelicula) != -1){
                        return true;
                    }else{
                        return false;
                    }
                }
            }
        );
        $("#detalle").html(rHtml);
        $('.ui.toggle.button').state({
          text: {
            inactive : 'Votar',
            active   : 'Seleccionado'
          }
        });
        hideMainView();
        return false;
    });

    $('body').delegate('.send-vote-action', 'click', function(){
        var btn = this;
        var idPelicula = $(btn).attr('data-selected-id');
        if (idPelicula == undefined){
            showNotification('information', 'Selecciona una de las películas!', 'topCenter');
        }
        $(btn).addClass('loading');
        console.log(idPelicula);
        setTimeout(function(){
            $(btn).removeClass('loading');
            showNotification('success', 'Tu voto ya ha sido tomado en cuenta!', 'topCenter');
        }, 2000);
        return false;
    });


    $('body').delegate('.see-results-action', 'click', function(){
        var id = $(this).attr("data-index");
        var votacion = getVotacion(id);
        var rHtml = detalleVotacionCard.render(votacion);
        $("#detalle").html(rHtml);
        hideMainView();
        return false;
    });

    // render votaciones
    var votaciones = [
        {
            idVotacion: 1,
            fechaPelicula: '01/06/2016',
            mensaje: 'Vota ya!',
            open: true
        },
        {
            idVotacion: 2,
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
        $('#header-icon').one(prefixAnimations, function(){
            $('#header-icon').removeClass('animated fadeOut');
            $('#header-icon').attr('src', 'img/header-icon'+currentIndex+'.png');
            $('#header-icon').addClass('animated fadeIn');
            $('#header-icon').one(prefixAnimations, function(){
                $('#header-icon').removeClass('animated fadeIn');
            });
        });
    }, 3500);
});
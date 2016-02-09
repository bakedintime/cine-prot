// "constants"
var CLASS_PROPUESTA = 'propuesta';
var CLASS_VOTACION = 'votacion';
var CLASS_PELICULA = 'pelicula';
var CLASS_USUARIO_VOTACION = 'usuario_votacion';
var CLASS_SETTINGS = 'settings';
var INSTANCE_NAME = 'sparkling-bird-2973';

// templates
var votacionCard = $.templates("#votacion-card");
var detalleVotacionCard = $.templates("#detalle-votacion-card");
var adminViewCard = $.templates("#admin-view-card");
var adminCreateVotingShowOptions = $.templates("#admin-create-voting-show-options");

var prefixAnimations = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
var settings;
var syncanoAccount;
var votacionesLocalObject = [];
var peliculasLocalObject = [];
var basil = new window.Basil({
    namespace: 'cinetir',
    storages: ['cookie', 'local'],
    expireDays: 800
});

var resizePopup = function(){$('.ui.popup').css('max-height', $(window).height());};

var initHello = function(){
    hello.init({
        google: settings.googlekey
    }, {
        redirect_uri: 'templates/redirect.html'
    });
};

var connectSyncano = function(){
    syncanoAccount = new Syncano({
        accountKey: "bba54d3eafd7649c200e2a0867a5837de78adc7a"
    });
};

var getSettings = function(){

    connectSyncano();
    syncanoAccount.instance(INSTANCE_NAME).class(CLASS_SETTINGS).dataobject().list()
    .then(function(res){
        settings = res.objects[0];

         // init libraries
        initHello();
        hello.on('auth.login', function(auth) {

            if (!checkAuthentication()){
                // Call user information, for the given network
                hello(auth.network).api(
                    '/me',
                    {
                        scope: 'email',
                        force: true
                    }
                ).then(function(r) {
                    // Inject it into the container
                    console.log('result from oauth callback', auth, r);

                    if ((r.email.indexOf('tir.com.gt') > -1)){
                        $('#sign-in-toggle .name-placeholder').text(r.name);
                        $('#sign-in-toggle img').attr('src', r.thumbnail);
                        $('#sign-in-toggle img').show();
                        $('#sign-in-toggle i').hide();

                        $('#sign-in-toggle').popup({
                            hoverable: true,
                            on: 'click',
                            onShow: function(){
                                resizePopup();
                            },
                            delay: {
                              show: 300,
                              hide: 800
                            }
                        });

                        basil.set('auth-id', {
                            name: r.name,
                            thumbnail: r.thumbnail,
                            email: r.email,
                            id: r.id,
                            votedFilms: []
                        });

                        // Mostrar la opción para crear encuestas,
                        // ver resultados y ver propuestas
                        var admins = settings.admins.split(',');
                        console.log(admins, admins.indexOf(r.email));
                        if (admins.indexOf(r.email) > -1){

                            var item = '<li class="item admin-menu-item">'+
                                '<i class="lock icon"></i>'+
                                '<a href="#admin" class="admin-action" > Propuestas</a>'+
                            '</li>';
                            $('.menu').append(item);
                        }

                        window.location.reload();
                    }else{
                        showNotification('error', 'Solo puedes participar utilizando un correo de tir.com.gt', 'topCenter');
                    }
                });
            }else{
                // Mostrar la opción para crear encuestas,
                // ver resultados y ver propuestas
                var admins = settings.admins.split(',');
                var usuario = basil.get('auth-id');
                console.log(admins, admins.indexOf(usuario.email));
                if (admins.indexOf(usuario.email) > -1){

                    var item = '<li class="item admin-menu-item">'+
                        '<i class="lock icon"></i>'+
                        '<a href="#admin" class="admin-action" > Admin</a>'+
                    '</li>';
                    $('.menu').append(item);
                }
            }
        });
    })
    .catch(function(error){
        console.log('Error!', error);
    });
};

var saveObject = function(className, doc){
    return syncanoAccount.instance(INSTANCE_NAME).class(className).dataobject().add(doc, function(){});
};

var updateObject = function(className, dataObjectID, doc){
    var filters = [
        'channel',
        'channel_room',
        'created_at',
        'group',
        'group_permissions',
        'links',
        'other_permissions',
        'owner',
        'owner_permissions',
        'revision',
        'updated_at'
    ];
    for (var property in doc) {
        if (doc.hasOwnProperty(property) && filters.indexOf(property) != -1) {
            delete doc[property];
        }else if (property == 'fecha_pelicula'){
            doc[property] = moment(doc[property].value).toISOString();
        }
    }
    console.log(doc);
    return syncanoAccount.instance(INSTANCE_NAME).class(className).dataobject(dataObjectID).update(doc, function(){});
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

var login = function(){
    if (!checkAuthentication()){
        hello('google').login({
            scope: 'email'
        });
    }
};

var logout = function(){
    if (checkAuthentication()){
        hello('google').logout();
        basil.remove('auth-id');

        $('#sign-in-toggle .name-placeholder').text('Ingresar');
        $('#sign-in-toggle img').hide();
        $('#sign-in-toggle i').show();

        $('#sign-in-toggle').popup('toggle');
        window.location.reload();
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

var prepareAdminView = function(){
    var rHtml = adminViewCard.render(votacionesLocalObject);
    $('#admin').html(rHtml);
    $('input[name="daterange"]').daterangepicker({
        singleDatePicker: true
    });
};

var hideSection = function(params){
    var hiddenClass = params.hiddenClass;
    var shownClass = params.shownClass;
    var onHideCallback = params.onHideCallback || false;
    var onShowCallback = params.onShowCallback || false;

    $(hiddenClass).addClass('animated fadeOutUp');
    $(hiddenClass).one(prefixAnimations, function(){
        $(hiddenClass).removeClass('animated fadeOutUp');
        $(shownClass).show();
        $(hiddenClass).hide();

        if (onHideCallback){
            onHideCallback();
        }

        $(shownClass).addClass('animated slideInDown');
        $(shownClass).one(prefixAnimations, function(){
            $(shownClass).removeClass('animated slideInDown');

            if (onShowCallback){
                onShowCallback();
            }
        });
    });
};

var buildGraph = function(opciones){
    var data = [];
    var index = 0;
    var colors = ["#F7464A", "#46BFBD", "#FDB45C"];
    var highlights = ["#FF5A5E", "#5AD3D1", "#FFC870"];

    var data = {
        labels: [
            "Red",
            "Green",
            "Yellow"
        ],
        datasets: [
            {
                data: [300, 50, 100],
                backgroundColor: [
                    "#F7464A",
                    "#46BFBD",
                    "#FDB45C"
                ],
                hoverBackgroundColor: [
                    "#FF5A5E",
                    "#5AD3D1",
                    "#FFC870"
                ]
            }]
    };

    /*$.each(opciones, function(i, v){
        data.push({
            value: v.votos,
            color: colors[index],
            highlight: highlights[index],
            label: v.nombre
        });
        index+=1;
    });*/

    var ctx = $("#myChart");
    var myPieChart = new Chart(ctx,{
        type:'pie',
        data: data
    });
};

var vote = function(id_pelicula){
    var btn = this;
    $('.ui.toggle.button.active').text('Votar');
    $('.ui.toggle.button.active').removeClass('active');
    if (!checkAuthentication()){
        $('#dimmer').dimmer('setting', {
            closable: false
        });
        $('#detalle-votacion-cards').dimmer('show');
        return false;
    }else{
        $(this).addClass('active');
        $('.send-vote-action').attr('data-selected-id', id_pelicula);
    }
    return false;
};

var getVotaciones = function(){

    var usuario = basil.get('auth-id');

    var email = ((usuario != null) ? usuario.email : '');

    var filter = {
        "query": {"email":{"_eq": email }}
    };

    syncanoAccount.instance(INSTANCE_NAME).class(CLASS_USUARIO_VOTACION).dataobject().list(filter, function(){})
    .then(function(res){
        votacionesUsuariosLocalObject = res.objects;
        //console.log("obtained usuario_votacion.", res);

        syncanoAccount.instance(INSTANCE_NAME).class(CLASS_VOTACION).dataobject().list()
        .then(function(res){
            votacionesLocalObject = res.objects;

            var rHtml = votacionCard.render(
                votacionesLocalObject,
                {
                    formatDate: function(dateObj){
                        return moment(dateObj.value, moment.ISO_8601).format('DD/MM/Y');
                    },
                    hasVoted: function(id_votacion){
                        var exists = $.grep(votacionesUsuariosLocalObject, function(e){ return e.id_votacion == id_votacion; });
                        return (exists.length > 0)
                    }
                }
            );
            $('#votaciones-cards').html(rHtml);

            //console.log("obtained votaciones.", res);
        })
        .catch(function(err) {
            console.log("Error!", err);
        });
    })
    .catch(function(err) {
        console.log("Error!", err);
    });

    syncanoAccount.instance(INSTANCE_NAME).class(CLASS_PELICULA).dataobject().list()
    .then(function(res){
        peliculasLocalObject = res.objects;
        //console.log("obtained peliculas.", res);
    })
    .catch(function(err) {
        console.log("Error!", err);
    });

};

var getPelicula = function(id_pelicula){
    return $.grep(peliculasLocalObject, function(e){ return e.id == id_pelicula; })[0];
};

var getVotacion = function(id_votacion, reverse){
    var votacion = $.grep(votacionesLocalObject, function(e){ return e.id == id_votacion; })[0];
    console.log(votacion);
    if (typeof votacion.opciones == 'string'){
        var peliculas = votacion.opciones.split(',');
        var opciones = [];
        $.each(peliculas, function(i,v){
            var opcion = getPelicula(v);
            opciones.push(opcion);
        });
        votacion.opciones = opciones;
    }else if ((typeof votacion.opciones != 'string') && (reverse)){
        var peliculas = votacion.opciones;
        var opciones = [];
        $.each(peliculas, function(i,v){
            opciones.push(v.id);
        });
        votacion.opciones = opciones.join(',');
    }
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

    $(window).resize(function(e){
        resizePopup();
    });

    // get project settings
    getSettings();

    if (checkAuthentication()){
        var settings = basil.get('auth-id');
        $('#sign-in-toggle .name-placeholder').text(settings.name);
        $('#sign-in-toggle img').attr('src', settings.thumbnail);
        $('#sign-in-toggle img').show();
        $('#sign-in-toggle i').hide();

        $('#sign-in-toggle').popup({
            hoverable: true,
            on: 'click',
            onShow: function(){
                resizePopup();
            },
            delay: {
              show: 300,
              hide: 800
            }
        });
    }

    $('.dimmer').dimmer('setting', {
        closable: false
    });

    // declare actions
    $('body').delegate('.vote-action', 'click', function(){
        var id = $(this).attr("data-index");
        var votacion = getVotacion(id, false);
        var rHtml = detalleVotacionCard.render(
            votacion,
            {
                formatDate: function(dateObj){
                    return moment(dateObj.value, moment.ISO_8601).format('DD/MM/Y');
                },
                hasVoted: function(id_votacion){
                    var exists = $.grep(votacionesUsuariosLocalObject, function(e){ return e.id_votacion == id_votacion; });
                    return (exists.length > 0)
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

        var showCallback = function(){
            if (!checkAuthentication()){
                $('#dimmer').dimmer('setting', {
                    closable: false
                });
                $('#detalle-votacion-cards').dimmer('show');
            }
        };
        var params = {
            hiddenClass: '.main-view',
            shownClass: '.detail-view',
            onShowCallback: showCallback
        };
        hideSection(params);
        return false;
    });

    $('body').delegate('.send-vote-action', 'click', function(){
        var btn = this;
        var id_pelicula = $(btn).attr('data-selected-id');
        if (id_pelicula == undefined){
            showNotification('information', 'Selecciona una de las películas!', 'topCenter');
        }else if (!checkAuthentication()){
            $('#detalle-votacion-cards').dimmer('show');
            return false;
        }
        $(btn).addClass('loading');

        var votacion = getVotacion(parseInt($('.detalle_id_votacion').text(), 10), true);
        votacion.total_votos += 1;
        console.log(votacion);
        updateObject(CLASS_VOTACION, votacion.id, votacion)
            .then(function(res){
                var pelicula = getPelicula(id_pelicula);
                pelicula.votos += 1;
                updateObject(CLASS_PELICULA, id_pelicula, pelicula)
                    .then(function(res){

                        var usuario = basil.get('auth-id');

                        // save relation from usuario and result from votacion
                        saveObject(CLASS_USUARIO_VOTACION, {
                            id_votacion: votacion.id,
                            id_pelicula: id_pelicula,
                            email: usuario.email
                        });

                        $(btn).removeClass('loading');
                        showNotification('success', 'Tu voto ya ha sido tomado en cuenta!', 'topCenter');
                    })
                    .catch(function(err){
                        console.log('err', err);
                    });
            })
            .catch(function(err){
                console.log('err', err);
            });
        return false;
    });

    $('body').delegate('.send-proposal-action', 'click', function(){
        var proposal = {};
        proposal.nombre = $('#proposal-form input[name="movie-name"]').val();
        proposal.duracion = $('#proposal-form input[name="length"]').val();
        proposal.link = $('#proposal-form input[name="link"]').val();

        if (
            proposal.nombre === '' ||
            proposal.duracion === '' ||
            proposal.link === ''
        ){
            showNotification('warning', 'Debe completar los campos del formulario', 'topCenter');
        }else{
            if (!checkAuthentication()){
                $('#proposal-form').dimmer('show');
            }else{
                var usuario = basil.get('auth-id');
                proposal.email = usuario.email;
                saveObject(CLASS_PROPUESTA, proposal);
                showNotification('success', '¡Gracias! Tu propuesta ha sido enviada', 'topCenter');
                // clear fields
                $('#proposal-form input').val('');
            }
        }
        return false;
    });

    $('body').delegate('.admin-action', 'click', function(){
        var params = {
            hiddenClass: '.main-view',
            shownClass: '.admin-view',
            onShowCallback: prepareAdminView
        };
        hideSection(params);
    });

    $('body').delegate('.back', 'click', function(){
        var params = {
            hiddenClass: '.detail-view',
            shownClass: '.main-view'
        };
        hideSection(params);
    });


    $('body').delegate('.see-results-action', 'click', function(){
        var id = $(this).attr("data-index");
        var votacion = getVotacion(id, false);
        var rHtml = detalleVotacionCard.render(
            votacion,
            {
                formatDate: function(dateObj){
                    return moment(dateObj.value, moment.ISO_8601).format('DD/MM/Y');
                },
                hasVoted: function(id_votacion){
                    var exists = $.grep(votacionesUsuariosLocalObject, function(e){ return e.id_votacion == id_votacion; });
                    return (exists.length > 0);
                },
                isWinner: function(id_pelicula){
                    var maxVotes = 0;
                    var empate = 0;

                    peliculasLocalObject.map(function(obj){
                        if (obj.votos > maxVotes){
                            maxVotes = obj.votos;
                        }else if (obj.votos == maxVotes){
                            empate = 1;
                        }
                    });
                    var exists = $.grep(peliculasLocalObject, function(e){ return e.votos == maxVotes && e.id == id_pelicula; });
                    return ((empate) ? 2 : (exists.length > 0));
                }
            }
        );
        $("#detalle").html(rHtml);


        hideSectionAndDim('.main-view', '.detail-view');

        //buildGraph(votacion.opciones);

        return false;
    });

    // render votaciones
    getVotaciones();

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

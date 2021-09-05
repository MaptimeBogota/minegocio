var findme_map = L.map('findme-map')
    .setView([4.65341, -74.08363], 12),
    osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    osmAttrib = '© OpenStreetMap contributors. <a href="http://www.openstreetmap.org/copyright">License</a>',
    osm = L.tileLayer(osmUrl, {minZoom: 9, maxZoom: 19, attribution: osmAttrib}).addTo(findme_map),
    category_data = [];

var findme_marker = L.marker([0,0], {draggable:true}).addTo(findme_map);
findme_marker.setOpacity(0);

if (location.hash) location.hash = '';

function zoom_to_point(chosen_place, map, marker) {
    console.log(chosen_place);

    marker.setOpacity(1);
    marker.setLatLng([chosen_place.lat, chosen_place.lon]);


    map.setView(chosen_place, 18, {animate: true});
}
$("#use_my_location").click(function (e) {
    $("#couldnt-find").hide();
    $("#success").hide();
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var point = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            }

            zoom_to_point(point, findme_map, findme_marker);

            $('#success').html("<strong>¡Encontrado!</strong> Mueve la chincheta hasta que esté <strong>exactamente sobre la ubicación de tu negocio</strong>.<br />Te recomendamos que hagas bastante zoom para ubicar la chincheta correctamente. Cuando lo hayas ubicado bien, puedes pasar a la siguiente sección: <a href='javascript:check_coordinates()'>Agregar información del establecimiento</a>.");
            $('#success').show();
            window.scrollTo(0, $('#address').position().top - 30);
            $('.step-2 a').attr('href', '#details');
        }, function (error) {
            $("#couldnt-find").show();
        });
    } else {
      $("#couldnt-find").show();
    }
});
$("#find").submit(function(e) {
    e.preventDefault();
    $("#couldnt-find").hide();
    $("#invalid-location").hide();
    $("#success").hide();
    var address_to_find = $("#address").val();
    if (address_to_find.length === 0) return;
    var qwarg = {
        format: 'json',
        q: address_to_find
    };
    var url = "https://nominatim.openstreetmap.org/search?" + $.param(qwarg);
    $("#findme h4").text('Buscando...');
    $("#findme").addClass("loading");
    $.getJSON(url, function(data) {
        if (data.length > 0) {
            zoom_to_point(data[0], findme_map, findme_marker);

            $('#success').html("<strong>¡Encontrado!</strong> Mueve la chincheta hasta que esté <strong>exactamente sobre la ubicación de tu negocio</strong>.<br />Te recomendamos que hagas bastante zoom para ubicar la chincheta correctamente. Cuando lo hayas ubicado bien, puedes pasar a la siguiente sección: <a href='javascript:check_coordinates()'>Agregar información del establecimiento</a>.");
            $('#success').show();
            window.scrollTo(0, $('#address').position().top - 30);
            $('.step-2 a').attr('href', '#details');
        } else {
            $("#couldnt-find").show();
        }
        $("#findme").removeClass("loading");
    });
});

$(window).on('hashchange', function() {
    if (location.hash == '#details') {
        $('#collect-data-step').removeClass('hide');
        $('#address-step').addClass('hide');
        $('#confirm-step').addClass('hide');
        $('.steps').addClass('on-2');
        $('.steps').removeClass('on-3');
    } else if (location.hash == '#done') {
        $('#confirm-step').removeClass('hide');
        $('#collect-data-step').addClass('hide');
        $('#address-step').addClass('hide');
        $('.steps').addClass('on-3');
    } else {
        $('#address-step').removeClass('hide');
        $('#collect-data-step').addClass('hide');
        $('#confirm-step').addClass('hide');
        $('.steps').removeClass('on-2');
        $('.steps').removeClass('on-3');
    }
    findme_map.invalidateSize();
});

$("#collect-data-done").click(function() {
    // Basic form validation
    if ($("#category").val().length == 0) {
        $("#form-invalid").text('Error: Selecciona al menos una categoría.');
        return false;
    } else if ($("#name").val().length < 2) {
        $("#form-invalid").text('Error: Ingresa el nombre del establecimiento.');
        return false;
    } else if ($("#phone").val().length < 7 && $("#website").length < 10) {
        $("#form-invalid").text('Error: Ingresa una página web o número de teléfonico válido.');
        return false;
    } else {
        $("#form-invalid").text("");
    }

    location.hash = '#done';

    var note_body =
        "Datos del establecimiento: \n" +
        "Nombre: " + $("#name").val() + "\n" +
        "Teléfono: " + $("#phone").val() + "\n" +
        "Website: " + $("#website").val() + "\n" +
        "Twitter: " + $("#twitter").val() + "\n" +
        "Facebook: " + $("#facebook").val() + "\n" +
        "Correo-e: " + $("#email").val() + "\n" +
        "Horario: " + $("#opening_hours").val() + "\n" +
        "Categorías: " + $("#category").val().join(", ") + "\n" +
        "Dirección: " + $("#address").val() + "\n" +
        "#MaptimeBogota \n",
        latlon = findme_marker.getLatLng(),
        note_data = {
            lat: latlon.lat,
            lon: latlon.lng,
            text: note_body
        };

    $.post(
        'https://api.openstreetmap.org/api/0.6/notes.json',
        note_data,
        function(result) {
            var id = result.properties.id;
            $("#linkcoords").append(
                '<a href="https://osm.org/note/' + id + '">https://osm.org/note/' + id + '</a>'
            );
        }
    );
});

function clearFields() {
    $("#name").val('');
    $("#phone").val('');
    $("#website").val('');
    $("#twitter").val('');
    $("#opening_hours").val('');
    $("#category").val('');
    $("#address").val('');
    $("#linkcoords").empty();
}

function check_coordinates() {
    var latlon = findme_marker.getLatLng();

    if ((latlon.lat != 0) || (latlon.lng != 0)) {
        location.hash = '#details';
    } else {
        $("#invalid-location").show();
    }
}

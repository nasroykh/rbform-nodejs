let dps = $("#dps").text();
let fonc = $("#fonc").text();
let year = $("#year").text();

$.ajax({
    type: "POST",
    url: "/getvalidradio",
    data: {dps : dps, fonc : fonc},
    success: function (valids) {
        $.each(valids, function (i, v) {
            isOkay = true;
            if ((v.valid1 == 0) || (v.valid1 == 1)) {
                $(`#v1radio${i}`).prop("checked",true);
            } 
            else if (v.valid1 == null) {
                $(`#v1radio${i}`).prop("checked",false);
            }

            if ((v.valid2 == 0) || (v.valid2 == 1)) {
                $(`#v2radio${i}`).prop("checked",true);
            } 
            else if ((v.valid2 == null)) {
                $(`#v2radio${i}`).prop("checked",false);
            }

            if ((v.valid3 == 0) || (v.valid3 == 1)) {
                $(`#v3radio${i}`).prop("checked",true);
            } 
            else if (v.valid3 == null) {
                $(`#v3radio${i}`).prop("checked",false);
                isOkay = false;
            }
        });
        if (!isOkay) {
            $(`#consgenbtn`).addClass("noaccess");
            $(`#consgenbtn`).parent().addClass("notallowed");
            $(`#consgenbtn`).parent().on("click", () => {
                alert("Validation de toutes les listes requise !")
            });
            $(`#consprintbtn`).addClass("noaccess");
            $(`#consprintbtn`).parent().addClass("notallowed");
            $(`#consprintbtn`).parent().on("click", () => {
                alert("Validation de toutes les listes requise !")
            });
        }
    } 
});

$.ajax({
    type: "POST",
    url: "/toCons",
    data: {dps : dps, fonc : fonc},
    success: function (list) {
        $.each(list.form, function (i, l) { 
            $(`#toconsbtn${i}`).on("click", function () {
                location.replace(`/${list.id}/${year}/consultlist/${l.code_form}_${l.code_org}/`);
            });
        });
    }
});

$("#consgenbtn").on("click", function () {
    
    let date_ob = new Date();

    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    let fulldate = (year + "-" + month + "-" + date);
    let fulltime = (hours + "''" + minutes + "''" + seconds);

    let empidsjson = {
        year : year,
        dps : dps,
        date : fulldate,
        time : fulltime
    }

    if (fonc == "DIR") {
        $.ajax({
            type: "POST",
            url: "/genCsv",
            data: empidsjson,
            success: function (response) {
            }
        });
        alert("Fichier CSV généré.");
        location.reload();
    }


});


$("#consprintbtn").on("click", function () {
        
    let date_ob = new Date();

    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    let fulldate = (year + "-" + month + "-" + date);
    let fulltime = (hours + "''" + minutes + "''" + seconds);

    let empidsjson2 = {
        year : year,
        dps : dps,
        date : fulldate,
        time : fulltime
    }

    if (fonc == "DIR") {
        $.ajax({
            type: "POST",
            url: "/toPrint",
            data: empidsjson2,
            success: function (response) {
                window.open(response.url);
            }
        });
    }

});


if (fonc == "SVC" || fonc == "DEP") {
    $(`#consgenbtn`).addClass("noaccess");
    $(`#consgenbtn`).parent().addClass("notallowed");
    $(`#consgenbtn`).parent().on("click", () => {
        alert("Action réalisable seulement par un directeur !")
    });
    $(`#consprintbtn`).addClass("noaccess");
    $(`#consprintbtn`).parent().addClass("notallowed");
    $(`#consprintbtn`).parent().on("click", () => {
        alert("Action réalisable seulement par un directeur !")
    });
}
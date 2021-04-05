let dps = $("#dps").text();
let fonc = $("#fonc").text();
$.ajax({
    type: "POST",
    url: "/getvalidradio",
    data: {dps : dps, fonc : fonc},
    success: function (valids) {
        $.each(valids, function (i, v) {
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
            }
            if (fonc == "SVC") {
                if (($(`#v2radio${i}`).prop("checked")) || ($(`#v3radio${i}`).prop("checked"))) {
                    $(`#toevbtn${i}`).addClass("noaccess");
                    $(`#toevbtn${i}`).parent().addClass("notallowed");
                    $(`#toevbtn${i}`).parent().on("click", () => {
                        alert("Liste déja validé par un supérieur !")
                    });
                }
            }
            if (fonc == "DEP") {
                if ($(`#v3radio${i}`).prop("checked")) {
                    $(`#toevbtn${i}`).addClass("noaccess");
                    $(`#toevbtn${i}`).parent().addClass("notallowed");
                    $(`#toevbtn${i}`).parent().on("click", () => {
                        alert("Liste déja validé par un supérieur !")
                    });                
                }
            }
        });
    } 
});

$(document).ready(function () {
    $("#logo").fadeIn(3000);
    $("#title").fadeIn(2000);
    $("#homeText").fadeIn(2000);
    $("#login").fadeIn(2000);
    $(".tab").fadeIn(1000);
    $(".welcomeText").fadeIn(1000);
});

$.ajax({
    type: "POST",
    url: "/toEv",
    data: {dps : dps, fonc : fonc},
    success: function (list) {
        $.each(list.form, function (i, l) { 
            $(`#toevbtn${i}`).on("click", function () {
                location.replace(`/${list.id}/validlist/${l.code_form}_${l.code_org}/`);
            });
        });
    }
});


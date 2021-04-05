let idback = $("#username").text();
let formback = $("#formation").text();
let dps = $("#dps").text();
let fonc = $("#fonc").text();
let year = $("#year").text();

$("#consbackbtn").on("click", function () {
    location.replace(`/${idback}/${year}/consultlist/`);
});


let empcheks = new Array();

$.ajax({
    type: "POST",
    url: "/getempscheck",
    data: {formation : $("#formation").text(), dps:dps,fonc:fonc},
    success: function (empv) {
        $.each(empv, function (i, emp) { 
            empcheks.push(`vcheck${i}`);
        });
        let empids = new Array();

        $(document).ready(function () {
            empids.splice(0,empids.length);
            $.each(empcheks, function (i, ch) { 
                if ($(`#objectif${i}`).val()) {
                    $(`#${ch}`).prop("checked",true);
                    if ($(`#${ch}`).is(":checked")) {
                        if (empids.includes($(`#${ch}`).parent().parent().children().eq(0).text())) {
                            alert("deja existe"+empids);    
                        }
                        else {
                        empids.push($(`#${ch}`).parent().parent().children().eq(0).text());
                        }
                    }
                    else {
                        let empidsarr = empids.indexOf($(`#${ch}`).parent().parent().children().eq(0).text());
                        empids.splice(empidsarr,1);
                    }
                }
            });
        });
    }
});
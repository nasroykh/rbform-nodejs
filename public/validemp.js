let idback = $("#username").text();
let formback = $("#formation").text();
$("#validbackbtn").on("click", function () {
    location.replace(`/${idback}/validlist/${formback}/`);
});

let empcheks = new Array();

let dps = $("#dps").text();
let fonc = $("#fonc").text();

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

        $("#selectallbtn").on("click", function () {
            empids.splice(0,empids.length);
            $.each(empcheks, function (i, ch) { 
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
            });
        });

        $("#deselectallbtn").on("click", function () {
            $.each(empcheks, function (i, ch) { 
                $(`#${ch}`).prop("checked",false);
            });
            empids.splice(0,empids.length);
        });

        $.each(empcheks, function (i, check) { 
            $(`#${check}`).on("change", function () {
                if ($(`#${check}`).is(":checked")) {
                    if (empids.includes($(this).parent().parent().children().eq(0).text())) {
                        alert("deja existe"+empids);    
                    }
                    else {
                    empids.push($(this).parent().parent().children().eq(0).text());
                    }
                }
                else {
                    let empidsarr = empids.indexOf($(this).parent().parent().children().eq(0).text());
                    empids.splice(empidsarr,1);
                }
            })
        });

        let date_ob = new Date();

        let date = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();
        let hours = date_ob.getHours();
        let minutes = date_ob.getMinutes();
        let seconds = date_ob.getSeconds();
        let fulldatetime = (year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);

        let empidsjson = {
            employes : [],
            formation : $("#formation").text(),
            id : $("#username").text(),
            date : fulldatetime,
            objectif : [],
            observation : [],
            allemps : empv
        }  

        $("#confirmvalidbtn").on("click", function () {
            for (let t = 0 ; t<empids.length ; t++) {
                empidsjson.employes.push(empids[t]);
            }
            $.each(empv, function (i, emp) { 
                empidsjson.objectif.push($(`#objectif${i}`).val());
                empidsjson.observation.push($(`#observation${i}`).val());
            });
            $.ajax({
                type: "POST",
                url: "/updatevalid",
                data: empidsjson,
                success: function (response) {
                    
                }
            });
            location.reload();
        });
    }
});
let $depselect = $("#depselect");
let $svcselect = $("#svcselect");
let $empselect = $("#empselect");

$("#formation").ready(function () {
    let formjs = {formid : $("#formation").text()};
    $.ajax({
        type: "POST",
        url: "/getform",
        data: formjs,
        success: function (response) {
            $("#formint").text(response[0].intitule_form);
        }
    });
});

$(document).ready(function () {
    let a = location.pathname;
    let fields = location.pathname.split("/");
    let selmod = fields[3];

    if (selmod =="empmodif") {
        $("#tolcbtn").addClass("noaccess");
        $("#tolcbtn").css({display : "none" });
        $("#backtomodifvalid").removeAttr("href");
        $("#backtomodifvalid").on("click", function () {
            location.replace(`/${$("#id").text()}/validlist/${$("#formation").text()}/`);
        });
    }
});

$("#tolcbtn").on("click", function () {
    let date_ob = new Date();

    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    let fulldatetime = (year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);

    let formjs = {
        formid : $("#formation").text(),
        datetime : fulldatetime
    };
    $.ajax({
        type: "POST",
        url: "/getform2",
        data: formjs,
        success: function (response) {
            location.replace(response.url);
        }
    });
});

$("#depselect").ready(function () {
    let dep = {
        svcid : $("#depselect").text(),
        svc : ""
    };
    console.log(dep);
    $.ajax({
        type: "POST",
        url: "/fetchSvc2",
        data: dep,
        success: function (svcs) {
            $svcselect.empty();
            $svcselect.append(`<option>Sélectionnez le Service</option>`);
            $.each(svcs, function (i, svc) { 
                 $svcselect.append(`<option value="${svc.code_svc}">${svc.intitule_svc}</option>`);
            });
        }
    });
    let emp = {
        mat : "",
        nom : "",
        prenom : "",
        diremp : "",
        depemp : $("#depselect").text(),
        svcemp : "",
        foncemp : ""
    }
    $.ajax({
        type: "POST",
        url: "/fetchEmp2",
        data: emp,
        success: function (emps) {
            $empselect.empty();
            let empcheks = new Array();
            let i = 0;
            $.each(emps, function (i, emp) { 
                if (emp.CODE_DEP == null) {
                    emp.CODE_DEP = "--";
                } 
                if (emp.CODE_SVC == null) {
                    emp.CODE_SVC = "--";
                }
                
                let emprow = $(`<tr class="clickable-row">
                    <td>${emp.MATRICULE}</td>
                    <td>${emp.NOM +` `+ emp.PRENOM}</td>
                    <td>${emp.CODE_DEP}</td>
                    <td>${emp.CODE_SVC}</td>
                    <td>${emp.INTITULE_FONC}</td>
                    <td class="checkbutton">
                    <input type="checkbox" name="" id="emp${i}" class="empcheck">
                    </td>
                </tr>`);
                empcheks.push(`emp${i}`);
                $empselect.append(emprow);
                i++;         
            });
            let empids = new Array();

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

            let empidsjson = {employes : [

            ],
            formation : $("#formation").text()} 

            $("#inbtn").on("click", function () {
                for (let t = 0 ; t<empids.length ; t++) {
                    empidsjson.employes.push(empids[t]);
                }
                $.ajax({
                    type: "POST",
                    url: "/empselected",
                    data: empidsjson,
                    success: function (response) {
                    
                    }
                });
                location.reload();
            });
        }
    });
});

$svcselect.on("change", function () {
    let emp = {
        mat : "",
        nom : "",
        prenom : "",
        diremp : "",
        depemp : "",
        svcemp : $(this).val(),
        foncemp : ""
    }
    $.ajax({
        type: "POST",
        url: "/fetchEmp",
        data: emp,
        success: function (emps) {
            $empselect.empty();
            let empcheks = new Array();
            let i = 0;
            $.each(emps, function (i, emp) { 
                let emprow = $(`<tr class="clickable-row">
                    <td>${emp.MATRICULE}</td>
                    <td>${emp.NOM +` `+ emp.PRENOM}</td>
                    <td>${emp.CODE_DEP}</td>
                    <td>${emp.CODE_SVC}</td>
                    <td>${emp.INTITULE_FONC}</td>
                    <td class="checkbutton">
                    <input type="checkbox" name="" id="emp${i}" class="empcheck">
                    </td>
                </tr>`);
                empcheks.push(`emp${i}`);
                $empselect.append(emprow);
                i++;        
            });
            let empids = new Array();

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

            let empidsjson = {employes : [

            ],
            formation : $("#formation").text()} 

            $("#inbtn").on("click", function () {
                for (let t = 0 ; t<empids.length ; t++) {
                    empidsjson.employes.push(empids[t]);
                }
                $.ajax({
                    type: "POST",
                    url: "/empselected",
                    data: empidsjson,
                    success: function (response) {
                    
                    }
                });
                location.reload();
            });
        }
    });
});


$("#empselected").ready(function () {
    let formselected = {
        formation : $("#formation").text(),
        user0 : $("#id").text()
    };
    $.ajax({
        type: "POST",
        url: "/fetchEmpSelected",
        data: formselected,
        success: function (response) {
            $("#empselected").empty();
            let empcheks2 = new Array();
            let i = 0;
            $.each(response, function (i, emp) { 
                if (emp.code_dep == null) {
                    emp.code_dep = "--";
                } 
                if (emp.code_svc == null) {
                    emp.code_svc = "--";
                }

                let emprow2 = $(`<tr class="clickable-row">
                    <td>${emp.matricule}</td>
                    <td>${emp.nom +` `+ emp.prenom}</td>
                    <td>${emp.code_dep}</td>
                    <td>${emp.code_svc}</td>
                    <td>${emp.intitule_fonc}</td>
                    <td class="checkbutton">
                    <input type="checkbox" name="" id="emps${i}" class="empcheck">
                    </td>
                </tr>`);
                empcheks2.push(`emps${i}`);
                $("#empselected").append(emprow2);
                i++;
            });
            let empids2 = new Array();

            $.each(empcheks2, function (i, check) { 
                $(`#${check}`).on("change", function () {
                    if ($(`#${check}`).is(":checked")) {
                        if (empids2.includes($(this).parent().parent().children().eq(0).text())) {
                            alert("deja existe"+empids2);    
                        }
                        else {
                        empids2.push($(this).parent().parent().children().eq(0).text());
                        }
                    }
                    else {
                        let empidsarr2 = empids2.indexOf($(this).parent().parent().children().eq(0).text());
                        empids2.splice(empidsarr2,1);
                    }
                })
            });

            let empidsjson2 = {employes : [

            ],
            formation : $("#formation").text()}

            $("#outbtn").on("click", function () {
                for (let t = 0 ; t<empids2.length ; t++) {
                    empidsjson2.employes.push(empids2[t]);
                }
                $.ajax({
                    type: "POST",
                    url: "/empselectedout",
                    data: empidsjson2,
                    success: function (response) {
                    
                    }
                });
                location.reload();
            });
        }
    });
});
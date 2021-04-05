let $depselect = $("#depselect");
let $svcselect = $("#svcselect");
let $empselect = $("#empselect");

//LOGIN PAGE
$("#loginbtn").on("click", function () {
    let username = $("#username").val();
    let password = $("#password").val();
    let authjson = {
        username : username,
        password : password
    };
    $.ajax({
        type: "POST",
        url: "/login",
        data: authjson,
        success: function (response) {
            if (!response) {
                alert("Nom d'Utilisateur et/ou Mot de Passe incorrect !");
                location.reload();
            }
        }
    });
});

$(document).ready(function () {
    $("#logo").fadeIn(2500);
    $("#title").fadeIn(2000);
    $("#homeText").fadeIn(2000);
    $("#login").fadeIn(2000);
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();

    today = dd + '/' + mm + '/' + yyyy;
    $("#date").text(today);
    $(".welcomeText").fadeIn(1000);
    $(".logout").fadeIn(1000);
    $("#actualyear").fadeIn(1000);
});

//CAT PAGE

$('#myTable').on('click', '.clickable-row', function(event) {
    if($(this).hasClass('selected')){
        $(this).removeClass('selected'); 
        } else {
        $(this).addClass('selected').siblings().removeClass('selected');   
    }
});

$("#toempselbtn").on("click", function () {
    let catarr = new Array();
    if ($("#myTable tbody tr").hasClass("selected")) {
        catarr.push($(".selected").children().eq(0).text().trim());
        catarr.push($(".selected").children().eq(1).text().trim());
    }
        
        let formjson = {
            form : catarr[0],
            org : catarr[1]
        }
        
    $.ajax({
        type: "POST",
        url: "/toEmpSel",
        data: formjson,
        success: function (response) {
            if (response.exist) {
                alert("Cette liste a déja été crée. \nRedirection vers la page de modification ...");
                location.replace(response.url);
            }
            else if (!(response.exist)) {
                location.replace(response.url);
            }
        }
    });
});

//MODIFVALID

$("#tomodifempbtn").on("click", function () {
    $.ajax({
        type: "POST",
        url: "/toEmpSel",
        data: {formation2 : $("#formation2").text()},
        success: function (response) {
            location.replace(response.url);
        }
    });
});

$("#tovalidempbtn").on("click", function () {
    $.ajax({
        type: "POST",
        url: "/getformmv",
        data: {formation2 : $("#formation2").text()},
        success: function (response) {
            location.replace(response.url);
        }
    });
});


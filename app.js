//REQUIRES AND USES AND SETS
var express = require("express");
var session = require("express-session");
var app = express();
var mysql = require("mysql");
var bodyParser = require("body-parser");
var path = require("path");


app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set("view engine", "ejs")

//DB CONNECTION

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'user',
    password: 'password',
    database: 'rbform',
    multipleStatements: true
});

connection.connect(function(err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
   
    console.log('Connecté à MySQL server.');
  });

// ROUTES

    //INDEX ROUTE 

app.get("/", (req,res) => {
    res.render("index");
});

        //TEST ROUTE
app.post("/login", (req,res) => {
    let username = req.body.username;
    let password = req.body.password;
    if (username && password) {
        let sql0 = "SET sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))";
        connection.query(sql0, (err, results999, fields) => {
            let sql = `SELECT * FROM utilisateur INNER JOIN employe ON utilisateur.matricule=employe.matricule WHERE nom_utilisateur = ? AND mot_de_passe = ?`;
            connection.query(sql,[username, password], (err, results, fields) => {
                if (results.length > 0) {
                    req.session.loggedin = true;
                    req.session.username = results[0].NOM;
                    req.session.name = results[0].NOM_UTILISATEUR.toLowerCase();
                    res.redirect(`/${req.session.name}/homepage`);
                }
                else{
                    res.send(false);
                }
            });
        });
    }
});

    //HOMEPAGE ROUTES

app.get("/:id/homepage", (req,res) => {
    if (req.session.loggedin) {
        res.render("homepage", {name : req.session.username} );
    }
    else {
        res.send("Connectez vous pour voir cette page.");
    }
    res.end();
});

app.post("/logout", (req,res) => {
    req.session.loggedin = false;
    res.redirect("/");
});

app.get("/toCat", (req,res) => {
    res.redirect(`/${req.session.name}/cat`);
});

app.get("/toValidList", (req,res) => {
    res.redirect(`/${req.session.name}/validlist`);
});

app.get("/toYear", (req,res) => {
    res.redirect(`/${req.session.name}/year`);
});



    // CAT ROUTES

app.get("/toHp", (req,res) => {
    res.redirect(`/${req.session.name}/homepage`);
});

app.get("/:id/cat", (req,res) => {
    if (req.session.loggedin) {
    let sql = `select intitule_form, intitule_org, lieu_org, duree_jours from catalogue_formation as cf inner join formation as fr inner join organisme as org on cf.code_form=fr.code_form and cf.code_org=org.code_org where annee="2020" order by intitule_form;`;
    connection.query(sql, (err, results, fields) => {
            res.render("cat", {data : results});
        });
    }
    else {
        res.send("Connectez vous pour voir cette page.");
    }
});

app.post("/toEmpSel", (req,res) => {
    if (req.body.form) {
        let intform = req.body.form;
        let intorg = req.body.org;
        let sql = `select cf.code_form, cf.code_org from catalogue_formation as cf inner join formation as fr inner join organisme as org on cf.code_form=fr.code_form and cf.code_org=org.code_org where intitule_form=? and intitule_org=?`;
        connection.query(sql,[intform,intorg], (err, results1, fields) => {
            let formid = results1[0].code_form;
            let orgid = results1[0].code_org;
            let sql2 = `select code_form, code_org from recueil where code_form =? and code_org=? and annee="2020";`;
            connection.query(sql2,[formid,orgid], (err, results2, fields) => {
                let formorg = `${formid}_${orgid}`;
                if ((results2[0])) {
                    res.send({
                        url : `/${req.session.name}/${formorg}/empmodif`,
                        exist : true
                    });
                }
                else {
                    res.send({
                        url : `/${req.session.name}/${formorg}/empsel`,
                        exist : false
                    });                
                }                
            });

        });
    }
    else if (req.body.formation2) {
        let a = req.body.formation2;
        let fields3 = a.split("_");
        let formid = fields3[0];
        let orgid = fields3[1];
        let formorg = `${formid}_${orgid}`
        res.send({
            url : `/${req.session.name}/${formorg}/empmodif`,
        });
    }
});


//EMP SEL ROUTES

app.get("/:id/:form/empsel", (req,res) => {
    if (req.session.loggedin) {
        let user = req.params.id;
        let formorg2 = req.params.form;
        let sqldps = `select em.code_fonc from utilisateur as ut inner join employe as em on ut.matricule=em.matricule where ut.nom_utilisateur=?;`;
        connection.query(sqldps,[user], (err, results1, fields) => {
            if (results1[0].code_fonc == "DIR") {
                let sql1 = `select intitule_dir from utilisateur as ut inner join employe as em inner join direction as dr on ut.matricule=em.matricule and em.code_dir=dr.code_dir where nom_utilisateur=?`;
                connection.query(sql1,[user], (err, results2, fields) => {
                    res.render("empseldr", {dirs : results2, formation : formorg2, id : user});
                });
            }
            else if (results1[0].code_fonc == "DEP") {
                let sql2 = `select intitule_dir,intitule_dep from utilisateur as ut inner join employe as em inner join direction as dr inner join departement as dp on ut.matricule=em.matricule and em.code_dir=dr.code_dir and em.code_dep=dp.code_dep where nom_utilisateur=?`;
                connection.query(sql2,[user], (err, results3, fields) => {
                    res.render("empseldp", {dirs : results3, formation : formorg2, id : user});
                });
            }
            else if (results1[0].code_fonc == "SVC") {
                let sql3 = `select intitule_dir,intitule_dep,intitule_svc,em.code_svc from utilisateur as ut inner join employe as em inner join direction as dr inner join departement as dp inner join service as sv on ut.matricule=em.matricule and em.code_dir=dr.code_dir and em.code_dep=dp.code_dep and em.code_svc=sv.code_svc where nom_utilisateur=?`;
                connection.query(sql3,[user], (err, results4, fields) => {
                    res.render("empselsv", {dirs : results4, formation : formorg2, id : user});
                });
            }
        });
    }
    else {
        res.send("Connectez vous pour voir cette page.");
    }
});

app.post("/getform", (req,res) => {
    let a = req.body.formid;
    let fields3 = a.split("_");
    let formid = fields3[0];
    let sql = `select intitule_form from formation where code_form=?`;
    connection.query(sql,[formid], (err, results, fields) => {
        res.send(results);
    });
});

app.post("/fetchDep", (req,res) => {
    let dirid = req.body.depid;
    let sql = `SELECT code_dep, intitule_dep FROM departement as dp inner join direction as dr on dp.code_dir=dr.code_dir WHERE dr.intitule_dir=?`;
    connection.query(sql,[dirid], (err, results, fields) => {
        res.send(results);
    });
});

app.post("/fetchSvc", (req,res) => {
    let depid = req.body.svcid;
    let sql = `SELECT code_svc, intitule_svc FROM service as sv inner join departement as dp on sv.code_dep=dp.code_dep WHERE sv.code_dep=?`;
    connection.query(sql,[depid], (err, results, fields) => {
        res.send(results);
    });
});

app.post("/fetchSvc2", (req,res) => {
    let depid = req.body.svcid;
    let sql = `SELECT code_svc, intitule_svc FROM service as sv inner join departement as dp on sv.code_dep=dp.code_dep WHERE dp.intitule_dep=?`;
    connection.query(sql,[depid], (err, results, fields) => {
        res.send(results);
    });
});

app.post("/fetchEmp", (req,res) => {
    if (req.body.diremp) {
        let diremp = req.body.diremp;
        let sql = `SELECT * FROM employe as em inner join fonction as fn inner join direction as dr on em.code_dir=dr.code_dir and em.code_fonc=fn.code_fonc WHERE intitule_dir=? order by intitule_fonc`;
        connection.query(sql,[diremp], (err, results, fields) => {
            res.send(results);
        });
    }
    else if (req.body.depemp) {
        let depemp = req.body.depemp;
        let sql = `SELECT * FROM employe as em inner join fonction as fn inner join departement as dp on em.code_dep=dp.code_dep and em.code_fonc=fn.code_fonc WHERE em.code_dep=? order by intitule_fonc`;
        connection.query(sql,[depemp], (err, results, fields) => {
            res.send(results);
        });
    }
    else if (req.body.svcemp) {
        let svcemp = req.body.svcemp;
        let sql = `SELECT * FROM employe as em inner join fonction as fn inner join service as sv on em.code_svc=sv.code_svc and em.code_fonc=fn.code_fonc WHERE em.code_svc=? order by intitule_fonc`;
        connection.query(sql,[svcemp], (err, results, fields) => {
            res.send(results);
        });
    }
});

app.post("/fetchEmp2", (req,res) => {
    if (req.body.diremp) {
        let diremp = req.body.diremp;
        let sql = `SELECT * FROM employe as em inner join fonction as fn inner join direction as dr on em.code_dir=dr.code_dir and em.code_fonc=fn.code_fonc WHERE intitule_dir=? order by intitule_fonc`;
        connection.query(sql,[diremp], (err, results, fields) => {
            res.send(results);
        });
    }
    else if (req.body.depemp) {
        let depemp = req.body.depemp;
        let sql = `SELECT * FROM employe as em inner join fonction as fn inner join departement as dp on em.code_dep=dp.code_dep and em.code_fonc=fn.code_fonc WHERE intitule_dep=? order by intitule_fonc`;
        connection.query(sql,[depemp], (err, results, fields) => {
            res.send(results);
        });
    }
    else if (req.body.svcemp) {
        let svcemp = req.body.svcemp;
        let sql = `SELECT * FROM employe as em inner join fonction as fn inner join service as sv on em.code_svc=sv.code_svc and em.code_fonc=fn.code_fonc WHERE em.code_svc=? order by intitule_fonc`;
        connection.query(sql,[svcemp], (err, results, fields) => {
            res.send(results);
        });
    }
});


app.post("/empselected", (req,res) => {
    let employes = req.body.employes;
    let formation = req.body.formation;
    let fields2 = formation.split("_");
    let form1 = fields2[0];
    let org1 = fields2[1];
    if (employes) {
        let sqldate = `select matricule,DATE_FORMAT(date_ajout,"%Y-%m-%d") as date, DATE_FORMAT(date_ajout,"%T") as time from recueil where code_form="${form1}" and code_org="${org1}" and annee="2020";`;
        connection.query(sqldate, (err, results0, fields) => {
            if (results0[0]) {
                if (results0[0].date) {
                    let dateajout = results0[0].date;
                    let timeajout = results0[0].time;
                    for (let o = 0 ; o<employes.length ; o++) {
                        let sql1 = `INSERT INTO recueil (MATRICULE,CODE_FORM,CODE_ORG,ANNEE,DATE_AJOUT) VALUES ("${employes[o]}", "${form1}", "${org1}","2020","${dateajout} ${timeajout}");`;
                        connection.query(sql1, (err, results, fields) => {
                        });
                    }
                } 
            }
            else {
                for (let o = 0 ; o<employes.length ; o++) {
                    let sql2 = `INSERT INTO recueil (MATRICULE,CODE_FORM,CODE_ORG,ANNEE) VALUES ("${employes[o]}", "${form1}", "${org1}","2020");`;
                    connection.query(sql2, (err, results2, fields) => {
                    });
                }
            }
        });
    }
});

app.post("/fetchEmpSelected", (req,res) => {
    let user = req.body.user0;
    let formation = req.body.formation;
    let fields2 = formation.split("_");
    let form1 = fields2[0];
    let org1 = fields2[1];
    let sqlfonc0 = `select code_fonc,code_dir,code_dep,code_svc from utilisateur as ut inner join employe as em on ut.matricule=em.matricule where nom_utilisateur=?;`;
    connection.query(sqlfonc0,[user], (err, results0, fields) => {
        if (results0[0].code_fonc == "DIR") {
            let dps = results0[0].code_dir; 
            let sql1 = `select em.matricule, em.nom, em.prenom, em.code_dep, em.code_svc , intitule_fonc, rc.code_form, rc.code_org from recueil as rc inner join employe as em inner join catalogue_formation as cf inner join fonction as fn on rc.matricule=em.matricule and rc.code_form=cf.code_form and rc.code_org=cf.code_org and em.code_fonc=fn.code_fonc WHERE rc.code_form=? AND rc.code_org=? AND rc.annee="2020" and em.code_dir=? order by intitule_fonc;`;
            connection.query(sql1,[form1,org1,dps], (err, results1, fields) => {
                res.send(results1);
            });
        }
        else if (results0[0].code_fonc == "DEP") {
            let dps = results0[0].code_dep; 
            let sql2 = `select em.matricule, em.nom, em.prenom, em.code_dep, em.code_svc , intitule_fonc, rc.code_form, rc.code_org from recueil as rc inner join employe as em inner join catalogue_formation as cf inner join fonction as fn on rc.matricule=em.matricule and rc.code_form=cf.code_form and rc.code_org=cf.code_org and em.code_fonc=fn.code_fonc WHERE rc.code_form=? AND rc.code_org=? AND rc.annee="2020" and em.code_dep=? order by intitule_fonc;`;
            connection.query(sql2,[form1,org1,dps], (err, results2, fields) => {
                res.send(results2);
            });
        }
        else if (results0[0].code_fonc == "SVC") {
            let dps = results0[0].code_svc; 
            let sql3 = `select em.matricule, em.nom, em.prenom, em.code_dep, em.code_svc , intitule_fonc, rc.code_form, rc.code_org from recueil as rc inner join employe as em inner join catalogue_formation as cf inner join fonction as fn on rc.matricule=em.matricule and rc.code_form=cf.code_form and rc.code_org=cf.code_org and em.code_fonc=fn.code_fonc WHERE rc.code_form=? AND rc.code_org=? AND rc.annee="2020" and em.code_svc=? order by intitule_fonc;`;
            connection.query(sql3,[form1,org1,dps], (err, results3, fields) => {
                res.send(results3);
            });
        }
    });
});

app.post("/empselectedout", (req,res) => {
    let employes = req.body.employes;
    let formation = req.body.formation;
    let fields2 = formation.split("_");
    let form1 = fields2[0];
    let org1 = fields2[1];
    if (employes) {
        for (let o = 0 ; o<employes.length ; o++) {
            let sql = `DELETE FROM recueil WHERE matricule="${employes[o]}" AND code_form="${form1}" AND code_org="${org1}" AND annee="2020";`;
            connection.query(sql, (err, results, fields) => {
            });
        }
    }
});

app.post("/getform2", (req,res) => {

    let time = req.body.datetime;
    let a = req.body.formid;
    let fields3 = a.split("_");
    let formid = fields3[0];
    let orgid = fields3[1];
    let sqlupd = `UPDATE recueil SET date_ajout=? WHERE code_form=? and code_org=? and annee="2020" ;`;
    connection.query(sqlupd,[time,formid,orgid], (err, results, fields) => {});
    let sql = `select cf.code_form, cf.code_org from catalogue_formation as cf inner join formation as fm inner join organisme as org on cf.code_form=fm.code_form and cf.code_org=org.code_org where cf.code_form=? and cf.code_org=?`;
    connection.query(sql,[formid,orgid], (err, results, fields) => {
        let formorg = `${results[0].code_form}_${results[0].code_org}`
        res.send({
            url : `/${req.session.name}/${formorg}/listcreated`,
        });
    });
});

    //LISTE CREATED ROUTES

app.get("/:id/:form/listcreated", (req,res) => {
    if (req.session.loggedin) {
    let a = req.params.form;
    let fields3 = a.split("_");
    let formid = fields3[0];
    let orgid = fields3[1];
    let sql = `select fm.intitule_form, org.lieu_org, DATE_FORMAT(date_ajout,"%Y-%m-%d %T") as date from recueil as rc inner join formation as fm inner join organisme as org on rc.code_form=fm.code_form and rc.code_org=org.code_org where rc.code_form=? and rc.code_org=? and rc.annee="2020";`;
    connection.query(sql,[formid,orgid], (err, results, fields) => {
        let formorg3 = `${results[0].intitule_form} (${results[0].lieu_org})`;
        let time2 = results[0].date;
        res.render("listcreated", {formation: formorg3, date : time2});
    });
    }
    else {
        res.send("Connectez vous pour voir cette page.");
    }
});

    //VALID LISTE ROUTES

app.get("/:id/validlist", (req,res) => {
    let user = req.params.id;
    let sqlfonc = `select code_fonc,code_dir,code_dep,code_svc from utilisateur as ut inner join employe as em on ut.matricule=em.matricule where nom_utilisateur=? ;`;
    connection.query(sqlfonc,[user],(err, results, fields) => {
        let dirid = results[0].code_dir;
        let depid = results[0].code_dep;
        let svcid = results[0].code_svc;
        if (results[0].code_fonc == "DIR") {
            let sql = `select code_dir, CONCAT(intitule_form," / ",lieu_org) as formation, valid1, valid1_user, DATE_FORMAT(valid1_date,"%Y-%m-%d") as v1date, DATE_FORMAT(valid1_date,"%T") as v1time, valid2, valid2_user, DATE_FORMAT(valid2_date,"%Y-%m-%d") as v2date, DATE_FORMAT(valid2_date,"%T") as v2time, valid3, valid3_user, DATE_FORMAT(valid3_date,"%Y-%m-%d") as v3date, DATE_FORMAT(valid3_date,"%T") as v3time, DATE_FORMAT(date_ajout,"%Y-%m-%d") as date, DATE_FORMAT(date_ajout,"%T") as time from recueil as rc inner join formation as fm inner join organisme as org inner join employe as em on rc.code_form=fm.code_form and rc.code_org=org.code_org and rc.matricule=em.matricule where rc.annee="2020" and code_dir=? group by formation,code_dir order by date_ajout DESC;`;
            connection.query(sql,[dirid],(err, results1, fields) => {
                res.render("validlist", {data : results1, dps : dirid, fonc : results[0].code_fonc});
            });
        }
        else if (results[0].code_fonc == "DEP") {
            let sql = `select code_dep, CONCAT(intitule_form," / ",lieu_org) as formation, valid1, valid1_user, DATE_FORMAT(valid1_date,"%Y-%m-%d") as v1date, DATE_FORMAT(valid1_date,"%T") as v1time, valid2, valid2_user, DATE_FORMAT(valid2_date,"%Y-%m-%d") as v2date, DATE_FORMAT(valid2_date,"%T") as v2time, valid3, valid3_user, DATE_FORMAT(valid3_date,"%Y-%m-%d") as v3date, DATE_FORMAT(valid3_date,"%T") as v3time, DATE_FORMAT(date_ajout,"%Y-%m-%d") as date, DATE_FORMAT(date_ajout,"%T") as time from recueil as rc inner join formation as fm inner join organisme as org inner join employe as em on rc.code_form=fm.code_form and rc.code_org=org.code_org and rc.matricule=em.matricule where rc.annee="2020" and code_dep=? group by formation,code_dep order by date_ajout DESC;`;
            connection.query(sql,[depid],(err, results2, fields) => {
                res.render("validlist", {data : results2, dps : depid, fonc : results[0].code_fonc});
            });
        }
        else if (results[0].code_fonc == "SVC") {
            let sql = `select code_svc, CONCAT(intitule_form," / ",lieu_org) as formation, valid1, valid1_user, DATE_FORMAT(valid1_date,"%Y-%m-%d") as v1date, DATE_FORMAT(valid1_date,"%T") as v1time, valid2, valid2_user, DATE_FORMAT(valid2_date,"%Y-%m-%d") as v2date, DATE_FORMAT(valid2_date,"%T") as v2time, valid3, valid3_user, DATE_FORMAT(valid3_date,"%Y-%m-%d") as v3date, DATE_FORMAT(valid3_date,"%T") as v3time, DATE_FORMAT(date_ajout,"%Y-%m-%d") as date, DATE_FORMAT(date_ajout,"%T") as time from recueil as rc inner join formation as fm inner join organisme as org inner join employe as em on rc.code_form=fm.code_form and rc.code_org=org.code_org and rc.matricule=em.matricule where rc.annee="2020" and code_svc=? group by formation,code_svc order by date_ajout DESC;`;
            connection.query(sql,[svcid],(err, results3, fields) => {
                res.render("validlist", {data : results3, dps : svcid, fonc : results[0].code_fonc});
            });
        }
    });
});

app.post("/getvalidradio", (req,res) => {
    if (req.body.fonc == "DIR") {
        let sql = `select code_dir, CONCAT(intitule_form," / ",lieu_org) as formation, valid1, valid2, valid3 from recueil as rc inner join formation as fm inner join organisme as org inner join employe as em on rc.matricule=em.matricule and rc.code_form=fm.code_form and rc.code_org=org.code_org where rc.annee="2020" and code_dir=? group by formation,code_dir order by date_ajout DESC;`;
        connection.query(sql,[req.body.dps],(err, results1, fields) => {
            res.send(results1);
        });
    }
    else if (req.body.fonc == "DEP") {
        let sql = `select code_dep, CONCAT(intitule_form," / ",lieu_org) as formation, valid1, valid2, valid3 from recueil as rc inner join formation as fm inner join organisme as org inner join employe as em on rc.matricule=em.matricule and rc.code_form=fm.code_form and rc.code_org=org.code_org where rc.annee="2020" and code_dep=? group by formation,code_dep order by date_ajout DESC;`;
        connection.query(sql,[req.body.dps],(err, results2, fields) => {
            res.send(results2);
        });
    }
    else if (req.body.fonc == "SVC") {
        let sql = `select code_svc, CONCAT(intitule_form," / ",lieu_org) as formation, valid1, valid2, valid3 from recueil as rc inner join formation as fm inner join organisme as org inner join employe as em on rc.matricule=em.matricule and rc.code_form=fm.code_form and rc.code_org=org.code_org where rc.annee="2020" and code_svc=? group by formation,code_svc order by date_ajout DESC;`;
        connection.query(sql,[req.body.dps],(err, results3, fields) => {
            res.send(results3);
        });
    }    
});

app.post("/toEv", (req,res) => {
    if (req.body.fonc == "DIR") {
        let sql = `select code_dir, CONCAT(intitule_form," / ",lieu_org) as formation, rc.code_form,rc.code_org from recueil as rc inner join formation as fm inner join organisme as org inner join employe as em on rc.matricule=em.matricule and rc.code_form=fm.code_form and rc.code_org=org.code_org where rc.annee="2020" and code_dir=? group by formation,code_dir order by date_ajout DESC;`;
        connection.query(sql,[req.body.dps],(err, results1, fields) => {
            res.send({form : results1,id : req.session.name});
        });
    }
    else if (req.body.fonc == "DEP") {
        let sql = `select code_dep, CONCAT(intitule_form," / ",lieu_org) as formation, rc.code_form,rc.code_org from recueil as rc inner join formation as fm inner join organisme as org inner join employe as em on rc.matricule=em.matricule and rc.code_form=fm.code_form and rc.code_org=org.code_org where rc.annee="2020" and code_dep=? group by formation,code_dep order by date_ajout DESC;`;
        connection.query(sql,[req.body.dps],(err, results2, fields) => {
            res.send({form : results2,id : req.session.name});
        });
    }
    else if (req.body.fonc == "SVC") {
        let sql = `select code_svc, CONCAT(intitule_form," / ",lieu_org) as formation, rc.code_form,rc.code_org from recueil as rc inner join formation as fm inner join organisme as org inner join employe as em on rc.matricule=em.matricule and rc.code_form=fm.code_form and rc.code_org=org.code_org where rc.annee="2020" and code_svc=? group by formation,code_svc order by date_ajout DESC;`;
        connection.query(sql,[req.body.dps],(err, results3, fields) => {
            res.send({form : results3,id : req.session.name});
        });
    } 
});

    //MODIFVALID ROUTES
app.get("/:id/validlist/:form/" , (req,res) => {
    let formation = req.params.form;
    res.render("modifvalid", {formorg : formation});
});

app.post("/getformmv", (req,res) => {
    let formation2 = req.body.formation2;
    let url = `/${req.session.name}/validlist/${formation2}/validemp`;
    res.send({url : url});
});



//VALIDEMP ROUTES

app.get("/:id/validlist/:form/validemp" , (req,res) => {
    let user = req.params.id;
    let a = req.params.form;
    let fields3 = a.split("_");
    let formid = fields3[0];
    let orgid = fields3[1];
    let sqlfonc = `select code_fonc,code_dir,code_dep,code_svc from utilisateur as ut inner join employe as em on ut.matricule=em.matricule where nom_utilisateur=? ;`;
    connection.query(sqlfonc,[user],(err, results, fields) => {
        let dirid = results[0].code_dir;
        let depid = results[0].code_dep;
        let svcid = results[0].code_svc;
        if (results[0].code_fonc == "DIR") {
            let sql = `select rc.matricule, nom, prenom, code_dep, code_svc, intitule_fonc, objectif, observation, valid1, valid2, valid3, intitule_form, lieu_org from recueil as rc inner join employe as em inner join fonction as fn inner join formation as fm inner join organisme as org on rc.matricule=em.matricule and em.code_fonc=fn.code_fonc and rc.code_form=fm.code_form and rc.code_org=org.code_org where rc.code_form=? and rc.code_org=? and annee="2020" and code_dir=? order by intitule_fonc;`;
            connection.query(sql,[formid,orgid,dirid],(err, results1, fields) => {
                for (let u=0 ; u<results1.length ; u++) {
                    if (results1[u].code_dep == null) {
                        results1[u].code_dep = "--";
                    } 
                    if (results1[u].code_svc == null) {
                        results1[u].code_svc = "--";
                    }
                }
                res.render("validemp", {data : results1, formation3 : a, username : user,dps : dirid, fonc : results[0].code_fonc});
            });
        }
        else if (results[0].code_fonc == "DEP") {
            let sql = `select rc.matricule, nom, prenom, code_dep, code_svc, intitule_fonc, objectif, observation, valid1, valid2, valid3, intitule_form, lieu_org from recueil as rc inner join employe as em inner join fonction as fn inner join formation as fm inner join organisme as org on rc.matricule=em.matricule and em.code_fonc=fn.code_fonc and rc.code_form=fm.code_form and rc.code_org=org.code_org where rc.code_form=? and rc.code_org=? and annee="2020" and code_dep=? order by intitule_fonc;`;
            connection.query(sql,[formid,orgid,depid],(err, results2, fields) => {
                for (let u=0 ; u<results2.length ; u++) {
                    if (results2[u].code_dep == null) {
                        results2[u].code_dep = "--";
                    } 
                    if (results2[u].code_svc == null) {
                        results2[u].code_svc = "--";
                    }
                }
                res.render("validemp", {data : results2, formation3 : a, username : user,dps : depid, fonc : results[0].code_fonc});
            });
        }
        else if (results[0].code_fonc == "SVC") {
            let sql = `select rc.matricule, nom, prenom, code_dep, code_svc, intitule_fonc, objectif, observation, valid1, valid2, valid3, intitule_form, lieu_org from recueil as rc inner join employe as em inner join fonction as fn inner join formation as fm inner join organisme as org on rc.matricule=em.matricule and em.code_fonc=fn.code_fonc and rc.code_form=fm.code_form and rc.code_org=org.code_org where rc.code_form=? and rc.code_org=? and annee="2020" and code_svc=? order by intitule_fonc;`;
            connection.query(sql,[formid,orgid,svcid],(err, results3, fields) => {
                for (let u=0 ; u<results3.length ; u++) {
                    if (results3[u].code_dep == null) {
                        results3[u].code_dep = "--";
                    } 
                    if (results3[u].code_svc == null) {
                        results3[u].code_svc = "--";
                    }
                }
                res.render("validemp", {data : results3, formation3 : a, username : user,dps : svcid, fonc : results[0].code_fonc});
            });
        }
    });
});

app.post("/getempscheck", (req,res) => {
    let a = req.body.formation;
    let fields3 = a.split("_");
    let formid = fields3[0];
    let orgid = fields3[1];

    if (req.body.fonc == "DIR") {
        let sql = `select rc.matricule from recueil as rc inner join employe as em inner join fonction as fn on rc.matricule=em.matricule and em.code_fonc=fn.code_fonc where code_form=? and code_org=? and annee="2020" and code_dir=? order by intitule_fonc;`;
        connection.query(sql,[formid,orgid,req.body.dps],(err, results1, fields) => {
            res.send(results1);
        });
    }
    else if (req.body.fonc == "DEP") {
        let sql = `select rc.matricule from recueil as rc inner join employe as em inner join fonction as fn on rc.matricule=em.matricule and em.code_fonc=fn.code_fonc where code_form=? and code_org=? and annee="2020" and code_dep=? order by intitule_fonc;`;
        connection.query(sql,[formid,orgid,req.body.dps],(err, results2, fields) => {
            res.send(results2);
        });
    }
    else if (req.body.fonc == "SVC") {
        let sql = `select rc.matricule from recueil as rc inner join employe as em inner join fonction as fn on rc.matricule=em.matricule and em.code_fonc=fn.code_fonc where code_form=? and code_org=? and annee="2020" and code_svc=? order by intitule_fonc;`;
        connection.query(sql,[formid,orgid,req.body.dps],(err, results3, fields) => {
            res.send(results3);
        });
    } 
});

app.post("/updatevalid", (req,res) => {
    let objs = req.body.objectif;
    let obss = req.body.observation;
    let allemps = req.body.allemps;
    let allempsarr = new Array();
    for (let t = 0; t < req.body.allemps.length; t++) {
        allempsarr.push(req.body.allemps[t].matricule);
    }
    let user = req.body.id;
    let date = req.body.date;
    let a = req.body.formation;
    let employes = req.body.employes;
    let fields3 = a.split("_");
    let formid = fields3[0];
    let orgid = fields3[1];

    if (employes) {
        for (let o = 0 ; o<objs.length ; o++) {
            if ((objs[o]) || (obss[o])) {
                let sqlupdoo = `update recueil set objectif="${objs[o]}", observation="${obss[o]}" where matricule="${allemps[o].matricule}" and code_form="${formid}" and code_org="${orgid}";`;
                connection.query(sqlupdoo, (err, results, fields) => {
                });
            }
        }
    }
    let sql = `select em.code_fonc from employe as em inner join utilisateur as ut on em.matricule=ut.matricule where nom_utilisateur=?;`;
    connection.query(sql,[user], (err, results1, fields) => {
        if (results1[0].code_fonc == "SVC") {
            if (employes) {
                for (let o = 0 ; o<employes.length ; o++) {
                    let sql1 = `update recueil set valid1=1 where matricule=? and code_form=? and code_org=? and annee="2020";`;
                    connection.query(sql1,[employes[o],formid,orgid], (err, results2, fields) => {
                    });
                    let sql2 = `update recueil set valid1_user="${user.toUpperCase()}" where matricule=? and code_form=? and code_org=? and annee="2020";`;
                    connection.query(sql2,[employes[o],formid,orgid], (err, results3, fields) => {
                    });
                    let sql3 = `update recueil set valid1_date="${date}" where matricule=? and code_form=? and code_org=? and annee="2020";`;
                    connection.query(sql3,[employes[o],formid,orgid], (err, results4, fields) => {
                    });
                }
            }
            let sqlminus = `select em.matricule from employe as em where em.matricule IN (?) AND em.matricule NOT IN (select rc.matricule from recueil as rc where rc.annee="2020" and rc.code_form=? AND rc.code_org=? AND rc.matricule IN (?));`;
            connection.query(sqlminus,[allempsarr,formid,orgid,employes], (err, results0, fields) => {
                for (let p = 0 ; p<results0.length ; p++) {
                    let sqldelete = `update recueil set valid1=0, valid1_date="${date}", valid1_user="${user.toUpperCase()}", objectif=null, observation=null where matricule="${results0[p].matricule}" and code_form="${formid}" and code_org="${orgid}" and annee="2020";`;
                    connection.query(sqldelete, (err, results9, fields) => {
                    });
                }    
            });
        }
        if (results1[0].code_fonc == "DEP") {
            if (employes) {
                for (let o = 0 ; o<employes.length ; o++) {
                    let sql1 = `update recueil set valid2=1 where matricule=? and code_form=? and code_org=? and annee="2020";`;
                    connection.query(sql1,[employes[o],formid,orgid], (err, results2, fields) => {
                    });
                    let sql2 = `update recueil set valid2_user="${user.toUpperCase()}" where matricule=? and code_form=? and code_org=? and annee="2020";`;
                    connection.query(sql2,[employes[o],formid,orgid], (err, results3, fields) => {
                    });
                    let sql3 = `update recueil set valid2_date="${date}" where matricule=? and code_form=? and code_org=? and annee="2020";`;
                    connection.query(sql3,[employes[o],formid,orgid], (err, results4, fields) => {
                    });
                }
            }
            let sqlminus = `select em.matricule from employe as em where em.matricule IN (?) AND em.matricule NOT IN (select rc.matricule from recueil as rc where rc.annee="2020" and rc.code_form=? AND rc.code_org=? AND rc.matricule IN (?));`;
            connection.query(sqlminus,[allempsarr,formid,orgid,employes], (err, results0, fields) => {
                for (let p = 0 ; p<results0.length ; p++) {
                    let sqldelete = `update recueil set valid2=0, valid2_date="${date}", valid2_user="${user.toUpperCase()}", objectif=null, observation=null where annee="2020" and matricule="${results0[p].matricule}" and code_form="${formid}" and code_org="${orgid}";`;
                    connection.query(sqldelete, (err, results9, fields) => {
                    });
                }    
            });
        }
        if (results1[0].code_fonc == "DIR") {
            if (employes) {
                for (let o = 0 ; o<employes.length ; o++) {
                    let sql1 = `update recueil set valid3=1 where matricule=? and code_form=? and code_org=? and annee="2020";`;
                    connection.query(sql1,[employes[o],formid,orgid], (err, results2, fields) => {
                    });
                    let sql2 = `update recueil set valid3_user="${user.toUpperCase()}" where matricule=? and code_form=? and code_org=? and annee="2020";`;
                    connection.query(sql2,[employes[o],formid,orgid], (err, results3, fields) => {
                    });
                    let sql3 = `update recueil set valid3_date="${date}" where matricule=? and code_form=? and code_org=? and annee="2020";`;
                    connection.query(sql3,[employes[o],formid,orgid], (err, results4, fields) => {
                    });
                }
            }
            let sqlminus = `select em.matricule from employe as em where em.matricule IN (?) AND em.matricule NOT IN (select rc.matricule from recueil as rc where rc.annee="2020" and rc.code_form=? AND rc.code_org=? AND rc.matricule IN (?));`;
            connection.query(sqlminus,[allempsarr,formid,orgid,employes], (err, results0, fields) => {
                for (let p = 0 ; p<results0.length ; p++) {
                    let sqldelete = `update recueil set valid3=0, valid3_date="${date}", valid3_user="${user.toUpperCase()}", objectif=null, observation=null where annee="2020" and matricule="${results0[p].matricule}" and code_form="${formid}" and code_org="${orgid}";`;
                    connection.query(sqldelete, (err, results9, fields) => {
                    });
                }    
            });
        }
    });
});

    //MODIF EMP ROUTES

app.get("/:id/:form/empmodif", (req,res) => {
    if (req.session.loggedin) {
        let user = req.params.id;
        let formorg2 = req.params.form;
        let sqldps = `select em.code_fonc from utilisateur as ut inner join employe as em on ut.matricule=em.matricule where ut.nom_utilisateur=?;`;
        connection.query(sqldps,[user], (err, results1, fields) => {
            if (results1[0].code_fonc == "DIR") {
                let sql1 = `select intitule_dir from utilisateur as ut inner join employe as em inner join direction as dr on ut.matricule=em.matricule and em.code_dir=dr.code_dir where nom_utilisateur=?`;
                connection.query(sql1,[user], (err, results2, fields) => {
                    res.render("empseldr", {dirs : results2, formation : formorg2, id : user});
                });
            }
            else if (results1[0].code_fonc == "DEP") {
                let sql2 = `select intitule_dir,intitule_dep from utilisateur as ut inner join employe as em inner join direction as dr inner join departement as dp on ut.matricule=em.matricule and em.code_dir=dr.code_dir and em.code_dep=dp.code_dep where nom_utilisateur=?`;
                connection.query(sql2,[user], (err, results3, fields) => {
                    res.render("empseldp", {dirs : results3, formation : formorg2, id : user});
                });
            }
            else if (results1[0].code_fonc == "SVC") {
                let sql3 = `select intitule_dir,intitule_dep,intitule_svc,em.code_svc from utilisateur as ut inner join employe as em inner join direction as dr inner join departement as dp inner join service as sv on ut.matricule=em.matricule and em.code_dir=dr.code_dir and em.code_dep=dp.code_dep and em.code_svc=sv.code_svc where nom_utilisateur=?`;
                connection.query(sql3,[user], (err, results4, fields) => {
                    res.render("empselsv", {dirs : results4, formation : formorg2, id : user});
                });
            }
        });
    }
    else {
        res.send("Connectez vous pour voir cette page.");
    }
});

    //YEAR ROUTES
app.get("/:id/year", (req,res) => {
    res.render("year");
});

app.post("/toCl", (req,res) => {
    res.redirect(`/${req.session.name}/${req.body.year}/consultlist`);
});


    //CONSULT LIST ROUTES

app.get("/:id/:year/consultlist", (req,res) => {
    let user = req.params.id;
    let year = req.params.year;
    let sqlfonc = `select code_fonc,code_dir,code_dep,code_svc from utilisateur as ut inner join employe as em on ut.matricule=em.matricule where nom_utilisateur=? ;`;
    connection.query(sqlfonc,[user],(err, results, fields) => {
        let dirid = results[0].code_dir;
        let depid = results[0].code_dep;
        let svcid = results[0].code_svc;
        if (results[0].code_fonc == "DIR") {
            let sql = `select code_dir, CONCAT(intitule_form," / ",lieu_org) as formation, valid1, valid1_user, DATE_FORMAT(valid1_date,"%Y-%m-%d") as v1date, DATE_FORMAT(valid1_date,"%T") as v1time, valid2, valid2_user, DATE_FORMAT(valid2_date,"%Y-%m-%d") as v2date, DATE_FORMAT(valid2_date,"%T") as v2time, valid3, valid3_user, DATE_FORMAT(valid3_date,"%Y-%m-%d") as v3date, DATE_FORMAT(valid3_date,"%T") as v3time, DATE_FORMAT(date_ajout,"%Y-%m-%d") as date, DATE_FORMAT(date_ajout,"%T") as time from recueil as rc inner join formation as fm inner join organisme as org inner join employe as em on rc.code_form=fm.code_form and rc.code_org=org.code_org and rc.matricule=em.matricule where rc.annee=? and code_dir=? group by formation,code_dir order by date_ajout DESC;`;
            connection.query(sql,[year,dirid],(err, results1, fields) => {
                res.render("consultlist", {data : results1, dps : dirid, fonc : results[0].code_fonc, year : year});
            });
        }
        else if (results[0].code_fonc == "DEP") {
            let sql = `select code_dep, CONCAT(intitule_form," / ",lieu_org) as formation, valid1, valid1_user, DATE_FORMAT(valid1_date,"%Y-%m-%d") as v1date, DATE_FORMAT(valid1_date,"%T") as v1time, valid2, valid2_user, DATE_FORMAT(valid2_date,"%Y-%m-%d") as v2date, DATE_FORMAT(valid2_date,"%T") as v2time, valid3, valid3_user, DATE_FORMAT(valid3_date,"%Y-%m-%d") as v3date, DATE_FORMAT(valid3_date,"%T") as v3time, DATE_FORMAT(date_ajout,"%Y-%m-%d") as date, DATE_FORMAT(date_ajout,"%T") as time from recueil as rc inner join formation as fm inner join organisme as org inner join employe as em on rc.code_form=fm.code_form and rc.code_org=org.code_org and rc.matricule=em.matricule where rc.annee=? and code_dep=? group by formation,code_dep order by date_ajout DESC;`;
            connection.query(sql,[year,depid],(err, results2, fields) => {
                res.render("consultlist", {data : results2, dps : depid, fonc : results[0].code_fonc, year : year});
            });
        }
        else if (results[0].code_fonc == "SVC") {
            let sql = `select code_svc, CONCAT(intitule_form," / ",lieu_org) as formation, valid1, valid1_user, DATE_FORMAT(valid1_date,"%Y-%m-%d") as v1date, DATE_FORMAT(valid1_date,"%T") as v1time, valid2, valid2_user, DATE_FORMAT(valid2_date,"%Y-%m-%d") as v2date, DATE_FORMAT(valid2_date,"%T") as v2time, valid3, valid3_user, DATE_FORMAT(valid3_date,"%Y-%m-%d") as v3date, DATE_FORMAT(valid3_date,"%T") as v3time, DATE_FORMAT(date_ajout,"%Y-%m-%d") as date, DATE_FORMAT(date_ajout,"%T") as time from recueil as rc inner join formation as fm inner join organisme as org inner join employe as em on rc.code_form=fm.code_form and rc.code_org=org.code_org and rc.matricule=em.matricule where rc.annee=? and code_svc=? group by formation,code_svc order by date_ajout DESC;`;
            connection.query(sql,[year,svcid],(err, results3, fields) => {
                res.render("consultlist", {data : results3, dps : svcid, fonc : results[0].code_fonc, year : year});
            });
        }
    });
});

app.post("/toCons", (req,res) => {
    if (req.body.fonc == "DIR") {
        let sql = `select code_dir, CONCAT(intitule_form," / ",lieu_org) as formation, rc.code_form,rc.code_org from recueil as rc inner join formation as fm inner join organisme as org inner join employe as em on rc.matricule=em.matricule and rc.code_form=fm.code_form and rc.code_org=org.code_org where rc.annee="2020" and code_dir=? group by formation,code_dir order by date_ajout DESC;`;
        connection.query(sql,[req.body.dps],(err, results1, fields) => {
            res.send({form : results1,id : req.session.name});
        });
    }
    else if (req.body.fonc == "DEP") {
        let sql = `select code_dep, CONCAT(intitule_form," / ",lieu_org) as formation, rc.code_form,rc.code_org from recueil as rc inner join formation as fm inner join organisme as org inner join employe as em on rc.matricule=em.matricule and rc.code_form=fm.code_form and rc.code_org=org.code_org where rc.annee="2020" and code_dep=? group by formation,code_dep order by date_ajout DESC;`;
        connection.query(sql,[req.body.dps],(err, results2, fields) => {
            res.send({form : results2,id : req.session.name});
        });
    }
    else if (req.body.fonc == "SVC") {
        let sql = `select code_svc, CONCAT(intitule_form," / ",lieu_org) as formation, rc.code_form,rc.code_org from recueil as rc inner join formation as fm inner join organisme as org inner join employe as em on rc.matricule=em.matricule and rc.code_form=fm.code_form and rc.code_org=org.code_org where rc.annee="2020" and code_svc=? group by formation,code_svc order by date_ajout DESC;`;
        connection.query(sql,[req.body.dps],(err, results3, fields) => {
            res.send({form : results3,id : req.session.name});
        });
    } 
});

    //CONSULT EMP ROUTES

app.get("/:id/:year/consultlist/:form/", (req,res) => {
    let year = req.params.year;
    let user = req.params.id;
    let a = req.params.form;
    let fields3 = a.split("_");
    let formid = fields3[0];
    let orgid = fields3[1];
    let sqlfonc = `select code_fonc,code_dir,code_dep,code_svc from utilisateur as ut inner join employe as em on ut.matricule=em.matricule where nom_utilisateur=? ;`;
    connection.query(sqlfonc,[user],(err, results, fields) => {
        let dirid = results[0].code_dir;
        let depid = results[0].code_dep;
        let svcid = results[0].code_svc;
        if (results[0].code_fonc == "DIR") {
            let sql = `select rc.matricule, nom, prenom, code_dep, code_svc, intitule_fonc, objectif, observation, valid1, valid2, valid3, intitule_form, lieu_org from recueil as rc inner join employe as em inner join fonction as fn inner join formation as fm inner join organisme as org on rc.matricule=em.matricule and em.code_fonc=fn.code_fonc and rc.code_form=fm.code_form and rc.code_org=org.code_org where rc.code_form=? and rc.code_org=? and annee="2020" and code_dir=? order by intitule_fonc;`;
            connection.query(sql,[formid,orgid,dirid],(err, results1, fields) => {
                for (let u=0 ; u<results1.length ; u++) {
                    if (results1[u].code_dep == null) {
                        results1[u].code_dep = "--";
                    } 
                    if (results1[u].code_svc == null) {
                        results1[u].code_svc = "--";
                    }
                }
                res.render("consultemp", {data : results1, formation3 : a, username : user,dps : dirid, fonc : results[0].code_fonc, year : year});
            });
        }
        else if (results[0].code_fonc == "DEP") {
            let sql = `select rc.matricule, nom, prenom, code_dep, code_svc, intitule_fonc, objectif, observation, valid1, valid2, valid3, intitule_form, lieu_org from recueil as rc inner join employe as em inner join fonction as fn inner join formation as fm inner join organisme as org on rc.matricule=em.matricule and em.code_fonc=fn.code_fonc and rc.code_form=fm.code_form and rc.code_org=org.code_org where rc.code_form=? and rc.code_org=? and annee="2020" and code_dep=? order by intitule_fonc;`;
            connection.query(sql,[formid,orgid,depid],(err, results2, fields) => {
                for (let u=0 ; u<results2.length ; u++) {
                    if (results2[u].code_dep == null) {
                        results2[u].code_dep = "--";
                    } 
                    if (results2[u].code_svc == null) {
                        results2[u].code_svc = "--";
                    }
                }
                res.render("consultemp", {data : results2, formation3 : a, username : user,dps : depid, fonc : results[0].code_fonc, year : year});
            });
        }
        else if (results[0].code_fonc == "SVC") {
            let sql = `select rc.matricule, nom, prenom, code_dep, code_svc, intitule_fonc, objectif, observation, valid1, valid2, valid3, intitule_form, lieu_org from recueil as rc inner join employe as em inner join fonction as fn inner join formation as fm inner join organisme as org on rc.matricule=em.matricule and em.code_fonc=fn.code_fonc and rc.code_form=fm.code_form and rc.code_org=org.code_org where rc.code_form=? and rc.code_org=? and annee="2020" and code_svc=? order by intitule_fonc;`;
            connection.query(sql,[formid,orgid,svcid],(err, results3, fields) => {
                for (let u=0 ; u<results3.length ; u++) {
                    if (results3[u].code_dep == null) {
                        results3[u].code_dep = "--";
                    } 
                    if (results3[u].code_svc == null) {
                        results3[u].code_svc = "--";
                    }
                }
                res.render("consultemp", {data : results3, formation3 : a, username : user,dps : svcid, fonc : results[0].code_fonc, year : year});
            });
        }
    });
});

app.post("/genCsv", (req,res) => {
    let date = req.body.date;
    let time = req.body.time;
    let year = req.body.year;
    switch (req.body.dps) {
        case "DSI":
            let sql = `select rc.matricule, em.nom, em.prenom, fn.intitule_fonc, fm.intitule_form, org.intitule_org, org.lieu_org, rc.objectif, rc.observation from recueil as rc inner join employe as em inner join fonction as fn inner join formation as fm inner join organisme as org on rc.matricule=em.matricule and em.code_fonc=fn.code_fonc and rc.code_form=fm.code_form and rc.code_org=org.code_org where annee=? and valid3=1 and code_dir=?
            INTO OUTFILE '/var/lib/mysql-files/${req.body.dps}_(${date})_(${time}).csv' 
            CHARACTER SET latin1 
            FIELDS ENCLOSED BY '"' 
            TERMINATED BY ',' 
            ESCAPED BY '"' 
            LINES TERMINATED BY '\r\n';`;
            connection.query(sql,[year,req.body.dps],(err, results3, fields) => {
            });
            require('child_process').exec(`echo password | sudo -S nautilus /var/lib/mysql-files`);
            break;

        case "DRH":
            let sql2 = `select rc.matricule, em.nom, em.prenom, fn.intitule_fonc, fm.intitule_form, org.intitule_org, org.lieu_org, rc.objectif, rc.observation from recueil as rc inner join employe as em inner join fonction as fn inner join formation as fm inner join organisme as org on rc.matricule=em.matricule and em.code_fonc=fn.code_fonc and rc.code_form=fm.code_form and rc.code_org=org.code_org where annee=? and valid3=1 and code_dir=?
            INTO OUTFILE '/var/lib/mysql-files/${req.body.dps}_(${date})_(${time}).csv'
            CHARACTER SET latin1 
            FIELDS ENCLOSED BY '"' 
            TERMINATED BY ',' 
            ESCAPED BY '"' 
            LINES TERMINATED BY '\r\n';`;
            connection.query(sql2,[year,req.body.dps],(err, results3, fields) => {
            });
            require('child_process').exec(`echo password | sudo -S nautilus /var/lib/mysql-files`);
            break;

        case "JUR":
            let sql3 = `select rc.matricule, em.nom, em.prenom, fn.intitule_fonc, fm.intitule_form, org.intitule_org, org.lieu_org, rc.objectif, rc.observation from recueil as rc inner join employe as em inner join fonction as fn inner join formation as fm inner join organisme as org on rc.matricule=em.matricule and em.code_fonc=fn.code_fonc and rc.code_form=fm.code_form and rc.code_org=org.code_org where annee=? and valid3=1 and code_dir=?
            INTO OUTFILE '/var/lib/mysql-files/${req.body.dps}_(${date})_(${time}).csv'
            CHARACTER SET latin1 
            FIELDS ENCLOSED BY '"' 
            TERMINATED BY ',' 
            ESCAPED BY '"' 
            LINES TERMINATED BY '\r\n';`;
            connection.query(sql3,[year,req.body.dps],(err, results3, fields) => {
            });
            require('child_process').exec(`echo password | sudo -S nautilus /var/lib/mysql-files`);
            break;

        case "FIN":
            let sql4 = `select rc.matricule, em.nom, em.prenom, fn.intitule_fonc, fm.intitule_form, org.intitule_org, org.lieu_org, rc.objectif, rc.observation from recueil as rc inner join employe as em inner join fonction as fn inner join formation as fm inner join organisme as org on rc.matricule=em.matricule and em.code_fonc=fn.code_fonc and rc.code_form=fm.code_form and rc.code_org=org.code_org where annee=? and valid3=1 and code_dir=?
            INTO OUTFILE '/var/lib/mysql-files/${req.body.dps}_(${date})_(${time}).csv'
            CHARACTER SET latin1 
            FIELDS ENCLOSED BY '"' 
            TERMINATED BY ',' 
            ESCAPED BY '"' 
            LINES TERMINATED BY '\r\n';`;
            connection.query(sql4,[year,req.body.dps],(err, results3, fields) => {
            });
            require('child_process').exec(`echo password | sudo -S nautilus /var/lib/mysql-files`);
            break;

        case "GSL":
            let sql5 = `select rc.matricule, em.nom, em.prenom, fn.intitule_fonc, fm.intitule_form, org.intitule_org, org.lieu_org, rc.objectif, rc.observation from recueil as rc inner join employe as em inner join fonction as fn inner join formation as fm inner join organisme as org on rc.matricule=em.matricule and em.code_fonc=fn.code_fonc and rc.code_form=fm.code_form and rc.code_org=org.code_org where annee=? and valid3=1 and code_dir=?
            INTO OUTFILE '/var/lib/mysql-files/${req.body.dps}_(${date})_(${time}).csv' 
            CHARACTER SET latin1 
            FIELDS ENCLOSED BY '"' 
            TERMINATED BY ',' 
            ESCAPED BY '"' 
            LINES TERMINATED BY '\r\n';`;
            connection.query(sql5,[year,req.body.dps],(err, results3, fields) => {
            });
            require('child_process').exec(`echo password | sudo -S nautilus /var/lib/mysql-files`);
            break;

        case "SSE":
            let sql6 = `select rc.matricule, em.nom, em.prenom, fn.intitule_fonc, fm.intitule_form, org.intitule_org, org.lieu_org, rc.objectif, rc.observation from recueil as rc inner join employe as em inner join fonction as fn inner join formation as fm inner join organisme as org on rc.matricule=em.matricule and em.code_fonc=fn.code_fonc and rc.code_form=fm.code_form and rc.code_org=org.code_org where annee=? and valid3=1 and code_dir=?
            INTO OUTFILE '/var/lib/mysql-files/${req.body.dps}_(${date})_(${time}).csv'
            CHARACTER SET latin1 
            FIELDS ENCLOSED BY '"' 
            TERMINATED BY ',' 
            ESCAPED BY '"' 
            LINES TERMINATED BY '\r\n';`;
            connection.query(sql6,[year,req.body.dps],(err, results3, fields) => {
            });
            require('child_process').exec(`echo password | sudo -S nautilus /var/lib/mysql-files`);
            break;

        case "EPP":
            let sql7 = `select rc.matricule, em.nom, em.prenom, fn.intitule_fonc, fm.intitule_form, org.intitule_org, org.lieu_org, rc.objectif, rc.observation from recueil as rc inner join employe as em inner join fonction as fn inner join formation as fm inner join organisme as org on rc.matricule=em.matricule and em.code_fonc=fn.code_fonc and rc.code_form=fm.code_form and rc.code_org=org.code_org where annee=? and valid3=1 and code_dir=?
            INTO OUTFILE '/var/lib/mysql-files/${req.body.dps}_(${date})_(${time}).csv'
            CHARACTER SET latin1 
            FIELDS ENCLOSED BY '"' 
            TERMINATED BY ',' 
            ESCAPED BY '"' 
            LINES TERMINATED BY '\r\n';`;
            connection.query(sql7,[year,req.body.dps],(err, results3, fields) => {
            });
            require('child_process').exec(`echo password | sudo -S nautilus /var/lib/mysql-files`);
            break;
    
        default:
            break;
    }
}); 

app.post("/toPrint", (req,res) =>{
    let id = req.session.name;
    let year = req.body.year;
    let dps = req.body.dps;
    res.send({url : `/${id}/${year}/consultlist/${dps}/print`});
})

    //PRINT ROUTES
app.get("/:id/:year/consultlist/:dps/print", (req,res) =>{
    let sql = `select intitule_dir, rc.matricule, em.nom, em.prenom, fn.intitule_fonc, fm.intitule_form, org.intitule_org, org.lieu_org, rc.objectif, rc.observation from recueil as rc inner join employe as em inner join fonction as fn inner join formation as fm inner join organisme as org inner join direction as dr on rc.matricule=em.matricule and em.code_fonc=fn.code_fonc and rc.code_form=fm.code_form and rc.code_org=org.code_org and em.code_dir=dr.code_dir where annee=? and valid3=1 and em.code_dir=?;`;
    connection.query(sql,[req.params.year,req.params.dps],(err, results, fields) => {
        res.render("printtemp", {data : results});
    });
})

    //SERVER LISTEN ROUTE
app.listen(3000, () => {
    console.log("Serveur en marche sur le port 3000");
});

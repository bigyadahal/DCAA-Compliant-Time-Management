import {
    Template
}
from 'meteor/templating';
import {
    Meteor
}
from 'meteor/meteor';
import '../collections/user-collection.js';
import '../node_modules/chart.js/dist/chart.js';
import './main.html';

/* global variables ------------------------------------------------------*/
var selectedProject = '';
var userEmail = '';
var salProj = '';
var t_hours = 0;

/* global functions ------------------------------------------------------*/
function random() {
    return Math.floor((Math.random() * 100) + 1);
}

function computeTime() {
    var hour_in = document.getElementById("start").value;
    var hour_out = document.getElementById("end").value;
    if (hour_in > hour_out) {} else {
        //calculate total hours
        var hours = hour_out.split(':')[0] - hour_in.split(':')[0];
        document.getElementById("totalHr").value = hours;
    }
}

function getDateWorkWeek() {
    var today = moment();
    var first_day_year = moment().startOf('year');
    var diff = today.diff(first_day_year, 'days');
    var dayOfYear = ((today - first_day_year + 86400000) / 86400000);
    return Math.ceil(dayOfYear / 7);
}

function getRoleByProject(email, project) {
    // get the user role based on their project
    var item = EmployeeProjects.find({
        $and: [{ //both below condition has to be true since it is $and
            "email": email
    }, {
            "project": project
    }, ]
    });
    return item;
}

function timesheetByProject(project, week) {
    var userid = Meteor.user();
    console.log(userid);
    console.log(project);
    console.log(week);
    const usr = Meteor.user(); // meteor user email address to find and return
    //var data = Timesheet.find({ "project" : project}).fetch();
    var items = Timesheet.find({
        $and: [{//all the three conditions has to be true
            "userid": Meteor.userId()
    }, {
            "project": project
    }, {
            "week": week.toString()
    }, ]
    });
    return items;
}

/* sitewide routing ------------------------------------------------------*/
Router.configure({
    layoutTemplate: 'Main'
});
/* site home page & utilities --------------------------------------------*/
Router.route('/Home'); // main home page
Router.route('/Login'); // main login page
Router.route('/ChangePassword'); // login redirect to change pwd
Router.route('/OwnerBusinessRegistration'); // owner & business registration
/* main users profile pages ----------------------------------------------*/
Router.route('/OwnerProfile'); // owner profile pages
Router.route('/AdminProfile'); // admin profile page
Router.route('/EmployeeProfile'); // employee profile page
Router.route('/AuditorProfile'); // auditor profile page
/* owner utilities -------------------------------------------------------*/
Router.route('/EditOwnerInfo'); // owner info editing page
Router.route('/EditBusinessInfo'); // business info editing page
Router.route('/AddBusinessAdmin'); // owner adds an admin
Router.route('/AdminList'); // owner views list of admins
/* owner & admin utilities -----------------------------------------------*/
Router.route('/EmployeeList'); // view of registered employees
/* owner, admin, & employee utilities ------------------------------------*/
Router.route('/EmployeeRegistration'); // employee registration redirect
Router.route('/empRegisterView'); // ???
Router.route('/ProjectList');
Router.route('/expenseSubmitView');
Router.route('/myTimesheets');
Router.route('/myDashboard');
Router.route('/myDashboardEmail');
Router.route('/last30');
/* auditor utilities -----------------------------------------------------*/
Router.route('/AuditorRegistration');

Router.route('/back');
// Router.route('/logout'); // added as template to other pages
// Router.route('/sendInvite'); // added as template to owner/admin pages
// Router.route('/hourJustification'); // removed ?
// Router.route('/hoursExplained'); // unknown ??

Router.route('/', {
    template: 'Home'
});

// First we subscribe to the users1 collection to:
// Meteor.subscribe("users1");
// Meteor.subscribe("employeeprojects");
Chart.pluginService.register({
    beforeRender: function (chart) {
        if (chart.config.options.showAllTooltips) {
            // create an array of tooltips
            // we can't use the chart tooltip because there is only one tooltip per chart
            chart.pluginTooltips = [];
            chart.config.data.datasets.forEach(function (dataset, i) {
                chart.getDatasetMeta(i).data.forEach(function (sector, j) {
                    if (chart.data.datasets[0].data[j] > 0) {
                        chart.pluginTooltips.push(new Chart.Tooltip({
                            _chart: chart.chart,
                            _chartInstance: chart,
                            _data: chart.data,
                            _options: chart.options.tooltips,
                            _active: [sector]
                        }, chart));
                    }
                });
            });
            // turn off normal tooltips
            chart.options.tooltips.enabled = false;
        }
    },
    afterDraw: function (chart, easing) {
        if (chart.config.options.showAllTooltips) {
            // we don't want the permanent tooltips to animate, so don't do anything till the animation runs atleast once
            if (!chart.allTooltipsOnce) {
                if (easing !== 1) return;
                chart.allTooltipsOnce = true;
            }
            // turn on tooltips
            chart.options.tooltips.enabled = true;
            Chart.helpers.each(chart.pluginTooltips, function (tooltip) {
                tooltip.initialize();
                tooltip.update();
                // we don't actually need this since we are not animating tooltips
                tooltip.pivot();
                tooltip.transition(easing).draw();
            });
            chart.options.tooltips.enabled = false;
        }
    }
});

/* site home page & utilities --------------------------------------------*/
Template.Navigation.events({
    'click .logout': function (event) {
        event.preventDefault();
        // calling Meteor.logout function from account-password package and
        // printing error in console
        Meteor.logout(function (err) {
            console.log(err);
        });
        Router.go('Home'); // redirect users to login page as soon as they log
    }
});
Template.Login.events({
    'submit form': function (event) {
        event.preventDefault();
        var myEmail = event.target.loginEmail.value;
        var myPassword = event.target.loginPassword.value;
        // check the meteor function to see if user name exists
        // loginwithPassword a callback function is provided by accounts-password
        // package. This helps to initiate the login process and the parameters of
        // error are email and password
        Meteor.loginWithPassword(myEmail, myPassword, function (error) {
            if (Meteor.user()) {
				//meteor.userId() to check the user is logged in. this will return the userid if they are logged in and undefined if they are not logged in
                if (Roles.userIsInRole(Meteor.userId(), ['business'])) {
                    Router.go('OwnerProfile');
                    console.log("Login Success! Owner.");
                } else if (Roles.userIsInRole(Meteor.userId(), ['admin'])) {
                    Router.go('AdminProfile');
                    console.log("Login Success!Admin.");
                } else if (Roles.userIsInRole(Meteor.userId(), ['user'])) {
                    Router.go('EmployeeProfile');
                    console.log("Login Success!Employee.");
                } else if (Roles.userIsInRole(Meteor.userId(), ['auditor'])) {
                    Router.go('AuditorProfile');
                    console.log("Login Success!.");
                }
            } else {
                console.log("ERROR: " + error.reason);
                alert(error.reason);
            }
        });
    }
});
Template.ChangePassword.events({
    'submit form': function (event) {
        event.preventDefault();
        var email = event.target.loginEmail.value;
        var oldpass = event.target.oldPassword.value;
        var pass = event.target.newPassword.value;
        var repass = event.target.rePassword.value;
        if (pass != repass) {
            alert("Passwords did not match!");
        } else {
            //change the password in the database
            Meteor.call('changepwd', email, pass, function (err, result) {
                if (!err) {
                    console.log("Congrats you change the password")
                } else {
                    console.log("there is an error caused by " + err.reason)
                }
            })
            Router.go('Login');
        }
    }
});
Template.OwnerBusinessRegistration.events({
    'submit form': function (event) {
        event.preventDefault();
        //creating variable and getting data from text box
        // get selected value for position
        var fName = document.getElementById("fName");
        var lName = document.getElementById("lName");
        var email = document.getElementById("regEmail");
        var contact = document.getElementById("contact");
        var home = document.getElementById("home");
        var city = document.getElementById("city");
        var state = document.getElementById("state");
        var zip = document.getElementById("zip");
        var country = document.getElementById("country");
        var bName = document.getElementById("businessName");
        var bEmail = document.getElementById("businessEmail");
        var bNumber = document.getElementById("businessNumber");
        var bAddress = document.getElementById("businessAddress");
        var bCity = document.getElementById("bCity");
        var bState = document.getElementById("bState");
        var bZip = document.getElementById("bZip");
        var bCountry = document.getElementById("bCountry");
        var businessData = {
            username: event.target.regEmail.value,
            email: event.target.regEmail.value,
            password: event.target.regPassword.value,
            profile: {
                firstName: fName,
                lastName: lName,
                email: email,
                contact: contact,
                home: home,
                city: city,
                state: state,
                zip: zip,
                country: country,
                bName: bName,
                bEmail: bEmail,
                bNumber: bNumber,
                bAddress: bAddress,
                bCity: bCity,
                bState: bState,
                bZip: bZip,
                bCountry: bCountry,
            },
        }
        Accounts.createUser(businessData, function (error) {
            if (Meteor.user()) {
                console.log(Meteor.userId());
                // assign business role by default
                Tracker.autorun(function () {
                    var user = Meteor.user();
                    if (user && !Roles.getRolesForUser(user).length) {
                        Meteor.call('addUserRoleBusiness', user);
                    }
                });
                console.log("Registation completed!.");
                Router.go('Login');
                console.log("ERROR: " + error.reason);
                alert(error.reason);
            }
        });
    }
});
Template.logout.events({
    'click .logout': function (event) {
        event.preventDefault();
        // calling Meteor.logout function from account-password package and printing error in console
        Meteor.logout(function (err) {
            console.log(err);
        });
        Router.go('login'); // redirect users to login page as soon as they log out.
    }
});
/* main users profile pages ----------------------------------------------*/
Template.OwnerProfile.events({
    'click .logout': function (event) {
        event.preventDefault();
        // calling Meteor.logout function from account-password package and printing error in console
        Meteor.logout(function (err) {
            console.log(err);
        });
        Router.go('Login'); // redirect users to login page as soon as they log
    }
});
Template.AdminProfile.events({
    'click .logout': function (event) {
        event.preventDefault();
        // calling Meteor.logout function from account-password package and printing error in console
        Meteor.logout(function (err) {
            console.log(err);
        });
        Router.go('Login'); // redirect users to login page as soon as they log out.
    }
});
Template.EmployeeProfile.events({
    'click .logout': function (event) {
        event.preventDefault();
        // calling Meteor.logout function from account-password package and printing error in console
        Meteor.logout(function (err) {
            console.log(err);
        });
        Router.go('Login'); // redirect users to login page as soon as they log out.
    }
});
Template.AuditorProfile.events({
    'click .logout': function (event) {
        event.preventDefault();
        // calling Meteor.logout function from account-password package and printing error in console
        Meteor.logout(function (err) {
            console.log(err);
        });
        Router.go('Login'); // redirect users to login page as soon as they log out.
    }
});
/* owner utilities -------------------------------------------------------*/
Template.EditOwnerInfo.events({
    'submit form': function (event) {
        event.preventDefault();
        var fName = document.getElementById("fName");
        var lName = document.getElementById("lName");
        var email = document.getElementById("regEmail");
        var contact = document.getElementById("contact");
        var home = document.getElementById("home");
        var city = document.getElementById("city");
        var state = document.getElementById("state");
        var zip = document.getElementById("zip");
        var country = document.getElementById("country");
        Meteor.call('profile', fName, lName, email, contact, home, city, state, zip, country)
        alert("Changes Have been made!");
        Router.go('AdminList');
    },

    'click .logout': function (event) {
        event.preventDefault();
        // calling Meteor.logout function from account-password package and printing error in console
        Meteor.logout(function (err) {
            console.log(err);
        });
        Router.go('Login'); // redirect users to login page as soon as they log
    }
});
Template.EditBusinessInfo.events({
    'submit form': function (event) {
        event.preventDefault();
        var bName = document.getElementById("businessName");
        var bEmail = document.getElementById("businessEmail");
        var bNumber = document.getElementById("businessNumber");
        var bAddress = document.getElementById("businessAddress");
        var bCity = document.getElementById("bCity");
        var bState = document.getElementById("bState");
        var bZip = document.getElementById("bZip");
        var bCountry = document.getElementById("bCountry");
        Meteor.call('profile', bName, bEmail, bNumber, bAddress, bCity, bState, bZip, bCountry)
        alert("Changes Have been made!");
        Router.go('adminList');
    }
});
Template.EmployeeRegistrationEmail.events({
    'submit form': function (event) {
        event.preventDefault();
        var emailVal = event.target.employee_email.value;
        //alert(emailVal);
        Meteor.call('sendEmployeeRegistrationEmail', emailVal);
        alert("Invite sent to: " + emailVal);
    },
});
Template.AddBusinessAdmin.events({
    'submit form': function (event) {
        event.preventDefault();
        // creating variable and getting data from text box get selected value
        // for position event.preventDefault();
        var email = event.target.regEmail.value;
        var position = event.target.position.value;
        var fname = event.target.firstName.value;
        var lname = event.target.lastName.value;
        var mName = event.target.middleName.value;
        var bEmail = event.target.registerB_Email.value;
        var phone = event.target.registerPhone.value;
        var address = event.target.registerAdd.value;
        var address_2 = event.target.registerAdd_2.value;
        var city = event.target.registerCity.value;
        var state = event.target.registerState.value;
        var zip = event.target.registerZip.value;
        var empID = event.target.registerEmpID.value;
        var ssn = event.target.registerSSN.value;
        var e = document.getElementById("position");
        var strPos = e.options[e.selectedIndex].value;
        var adminData = {
            email: email,
            password: event.target.registerPassword.value,
            profile: {
                position: strPos,
                firstName: fname,
                lastName: lname,
                mName: mName,
                bEmail: bEmail,
                phone: phone,
                address: address,
                address_2: address_2,
                city: city,
                state: state,
                zip: zip,
                empID: empID,
                ssn: ssn,
            },
        }
        // calling default function to register the user entered data
        Accounts.createUser(adminData, function (error) {
            /* // check and throw the error if email is already created
            if (Meteor.users.find({emails: event.target.registerEmail.value})) {
                alert("This email address is already registered");
                throw new Meteor.Error(403, "This email address is already
                registered");
            }*/
            if (Meteor.user()) {
                console.log(Meteor.userId());
                //add record to our database
                Meteor.call("addUser", Meteor.userId(), fname, lname, email, strPos,
                    phone, address, city, state, zip);
                Tracker.autorun(function () {
                    var user = Meteor.user();
                    if (user && !Roles.getRolesForUser(user).length) {
                        Meteor.call('addUserRole', user);
                    }
                });
                if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
                    console.log("Admin user Created!");
                }
                if (Roles.userIsInRole(Meteor.userId(), 'user')) {
                    console.log("Normal user Created!");
                }
                console.log("Registation completed!.");
                Router.go('Login');
                //document.location.reload(true);
            } else {
                console.log("ERROR: " + error.reason);
                alert(error.reason);
            }
        });
    }
}); // was register
Template.AdminList.events({
    'click .logout': function (event) {
        event.preventDefault();
        // calling Meteor.logout function from account-password package and printing error in console
        Meteor.logout(function (err) {
            console.log(err);
        });
        Router.go('Login'); // redirect users to login page as soon as they log out.
    },
    "click .toggle-checked": function () {
        // Set the checked property to the opposite of its current value
        Meteor.call("setChecked", this._id, !this.checked);
    },
    "click .delete": function () {
        Meteor.call("deleteUser", this._id);
    },
});
Template.AdminList.helpers({
    userslist: function () {
        //, return all of the users
        return Users1.find({
            position: 'Admin'
        }, {
            sort: {
                createdAt: -1
            }
        });
    },
    employeeprojects: function (user) {
        //return all of the registered projects for email id
        return EmployeeProjects.find({
            "email": user.email
        });
    }
});
/* owner & admin utilities -----------------------------------------------*/
Template.EmployeeList.events({

    'click .link'(event) {
        Session.set('clickedEmail', 'mia@gmail.com');
    },
    'click .logout': function (event) {
        event.preventDefault();
        // calling Meteor.logout function from account-password package and printing error in console
        Meteor.logout(function (err) {
            console.log(err);
        });
        Router.go('Login'); // redirect users to login page as soon as they log out.
    },
    "click .toggle-checked": function () {
        // Set the checked property to the opposite of its current value
        Meteor.call("setChecked", this._id, !this.checked);
    },
    "click .delete": function () {
        Meteor.call("deleteUser", this._id);
    },
    'change select': function (event) {
        const selectElem = event.currentTarget;

        switch (selectElem.value) {
            case 'Select Project':

                var span = document.getElementById(this._id); // update dynamic span
                span.textContent = "";
                break;
            default:
                console.log("project: ", selectElem.value);
                console.log("userEmail: ", userEmail);
                // userEmail = "mia@gmail.com"; original
                // get role by project
                var roleData = getRoleByProject(userEmail, selectElem.value);
                var role = roleData.fetch()[0].role;
                console.log("role: ", role);
                //set span value here
                var span = document.getElementById(this._id); // update dynamic span
                span.textContent = role;
                break;
        }
    },
});
Template.EmployeeList.helpers({
    userslist: function () {
        //, return all of the users
        return Users1.find({}, {
            sort: {
                createdAt: -1
            }
        });
    },
    employeeprojects: function (user) {
        //return all of the registered projects for email id
        userEmail = user.email;
        return EmployeeProjects.find({
            "email": user.email
        });
        //return EmployeeProjects.find({});
    },
    employeeprojectsemail: function (user) {
        //return all of the registered projects for email id
        userEmail = user.email;
        var projects = EmployeeProjects.find({
            "email": user.email
        });
        firstProject = projects.fetch()[0].project;
        var roleData = getRoleByProject(userEmail, firstProject);
        firstRole = roleData.fetch()[0].role;
        console.log("first: ", firstRole);
        return firstRole;
    }
});
Template.EmployeeList.onRendered(function (event) {
    // get the selected project
    //console.log("Rendered");
}); // ???
Template.AssignToProject.events({
    'submit form': function (event) {
        event.preventDefault();
        var project = event.target.registerProject.value;
        var role = event.target.assignRole.value;
        var emailValue = event.target.registerEmail.value;
        Meteor.call("addEmployeeToProject", emailValue, project, role);
        alert(emailValue + " added to project: " + role + project);
    },
});
/* owner, admin, & employee utilities ------------------------------------*/
Template.EmployeeRegistration.events({
    'submit form': function (event) {
        event.preventDefault(); // to prevent default behaviour of the event from occuring.
        // creating variable and getting data from text box get selected value
        // for position event.preventDefault();
        var email = event.target.regEmail.value;
        var position = event.target.position.value;
        var fname = event.target.firstName.value;
        var lname = event.target.lastName.value;
        var mName = event.target.middleName.value;
        var bEmail = event.target.registerB_Email.value;
        var phone = event.target.registerPhone.value;
        var address = event.target.registerAdd.value;
        var address_2 = event.target.registerAdd_2.value;
        var city = event.target.registerCity.value;
        var state = event.target.registerState.value;
        var zip = event.target.registerZip.value;
        var empID = event.target.registerEmpID.value;
        var ssn = event.target.registerSSN.value;
        var e = document.getElementById("position");
        var strPos = e.options[e.selectedIndex].value;
        var employeeData = {
            email: email,
            password: event.target.registerPassword.value,
            profile: {
                position: strPos,
                firstName: fname,
                lastName: lname,
                mName: mName,
                bEmail: bEmail,
                phone: phone,
                address: address,
                address_2: address_2,
                city: city,
                state: state,
                zip: zip,
                empID: empID,
                ssn: ssn,
            },
        }
        // calling default function to register the user entered data
        Accounts.createUser(employeeData, function (error) {
            /* // check and throw the error if email is already created
            if (Meteor.users.find({emails: event.target.registerEmail.value})) {
                alert("This email address is already registered");
                throw new Meteor.Error(403, "This email address is already
                registered");
            }*/
            if (Meteor.user()) {
                console.log(Meteor.userId());
                //add record to our database
                Meteor.call("addUser", Meteor.userId(), fname, lname, email, strPos,
                    phone, address, city, state, zip);
                Tracker.autorun(function () {
                    var user = Meteor.user();
                    if (user && !Roles.getRolesForUser(user).length) {
                        Meteor.call('addUserRole', user);
                    }
                });
                if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
                    console.log("Admin user Created!");
                }
                if (Roles.userIsInRole(Meteor.userId(), 'user')) {
                    console.log("Normal user Created!");
                }
                console.log("Registation completed!.");
                Router.go('Login');
                //document.location.reload(true);
            } else {
                console.log("ERROR: " + error.reason);
                alert(error.reason);
            }
        });
    }
}); // was register
Template.ProjectList.events({
    'click .logout': function (event) {
        event.preventDefault();
        // calling Meteor.logout function from account-password package and printing error in console
        Meteor.logout(function (err) {
            console.log(err);
        });
        Router.go('Login'); // redirect users to login page as soon as they log out.
    },
    "click .toggle-checked": function () {
        // Set the checked property to the opposite of its current value
        Meteor.call("setChecked", this._id, !this.checked);
    },
    "click .delete": function () {
        Meteor.call("deleteUser", this._id);
    },
});
Template.ProjectList.helpers({
    userslist: function () {
        //, return all of the users
        return Users1.find({}, {
            sort: {
                createdAt: -1
            }
        });
    },
    employeeprojects: function (user) {
        //return all of the registered projects for email id
        return EmployeeProjects.find({
            "email": user.email
        });
    }
});
Template.expenseSubmit.events({
    'submit form'(event, instance) {
        var first = $('#firstName').val();
        var last = $('#lastName').val();
        var email = $('#email').val();
        var department = $('#department').val();
        var item1 = $('#item').val();
        var itemdate = $('#itemDate').val();
        var purpose = $('#purpose').val();
        var reciept = $('#reciept').val();
        expenseSubmit.insert({
            first: first,
            last: last,
            email: email,
            department: department,
            item1: item1,
            itemdate: itemdate,
            purpose: purpose,
            receipt: reciept
        });
        $('#firstName').val('');
        $('#lastName').val('');
        $('#email').val('');
        $('#department').val('');
        $('#item1').val('');
        $('#itemdate').val('');
        $('#purpose').val('');
        $('#receipt').val('');
    }
});
Template.expenseSubmitView.events({
    'click .logout': function (event) {
        event.preventDefault();
        // calling Meteor.logout function from account-password package and printing error in console
        Meteor.logout(function (err) {
            console.log(err);
        });
        Router.go('Login'); // redirect users to login page as soon as they log
    }
});
Template.expenseSubmitView.helpers({
    expense() {
        return expenseSubmit.find();
    }
});
Template.myTimesheets.events({
    'submit form': function (event) {
        event.preventDefault();
        // get the selected project
        var e = document.getElementById("projectOptions");
        var project = e.options[e.selectedIndex].value;
        console.log(project);
        var week = event.target.week.value;
        var monday = event.target.monday.value;
        var tuesday = event.target.tuesday.value;
        var wednesday = event.target.wednesday.value;
        var thursday = event.target.thursday.value;
        var friday = event.target.friday.value;
        var userid = Meteor.userId();
        var approval = "NO";
        // insert into the table
        if (project != "SelectProject") {
            Meteor.call('addDailyHours', userid, project, week, monday, tuesday, wednesday, thursday, friday, function (err, result) {
                if (!err) {
                    document.location.reload(true);
                } else {
                    alert("there is an error caused by " + err.reason);
                }
            });
        } else {
            alert("Please select Valid Project");
        }
    },
    'click .logout': function (event) {
        event.preventDefault();
        // calling Meteor.logout function from account-password package and printing error in console
        Meteor.logout(function (err) {
            console.log(err);
        });
        Router.go('Login'); // redirect users to login page as soon as they log out.
    },
    'change select': function (event) {
        const selectElem = event.currentTarget;
        switch (selectElem.value) {
            case 'Select Project':
                // when no project selected, its zero
                document.getElementById("monday").value = 0;
                document.getElementById("tuesday").value = 0;
                document.getElementById("wednesday").value = 0;
                document.getElementById("thursday").value = 0;
                document.getElementById("friday").value = 0;
                var e = document.getElementById("projectOptions");
                e.options[e.selectedIndex].value = selectElem.value
                break;
            default:
                // get existing values from database
                week = document.getElementById("week").value;
                console.log(selectElem.value, " selected");
                timeSheetDataByWeek = timesheetByProject(selectElem.value, week);
                var e = document.getElementById("projectOptions");
                e.options[e.selectedIndex].value = selectElem.value
                // update Monday
                var updatedValue = '';
                timeSheetDataByWeek.forEach(function (doc) {
                    updatedValue = doc.mon;
                });
                document.getElementById("monday").value = updatedValue;
                if (updatedValue != '') {
                    //document.getElementById("monday").disabled = 'true';
                }
                // update Tuesday
                updatedValue = '';
                timeSheetDataByWeek.forEach(function (doc) {
                    updatedValue = doc.tues;
                });
                document.getElementById("tuesday").value = updatedValue;
                if (updatedValue != '') {
                    //document.getElementById("tuesday").disabled = 'true';
                }
                // update Wednesday
                var updatedValue = '';
                timeSheetDataByWeek.forEach(function (doc) {
                    updatedValue = doc.wed;
                });
                document.getElementById("wednesday").value = updatedValue;
                if (updatedValue != '') {
                    //document.getElementById("wednesday").disabled = 'true';
                }
                // update Thursday
                var updatedValue = '';
                timeSheetDataByWeek.forEach(function (doc) {
                    updatedValue = doc.th;
                });
                document.getElementById("thursday").value = updatedValue;
                if (updatedValue != '') {
                    //document.getElementById("thursday").disabled = 'true';
                }
                // update Friday
                var updatedValue = '';
                timeSheetDataByWeek.forEach(function (doc) {
                    updatedValue = doc.fri;
                });
                document.getElementById("friday").value = updatedValue;
                if (updatedValue != '') {
                    //document.getElementById("friday").disabled = 'true';
                }
                //console.log(Mon);
                break;
        }
    }
});
Template.myTimesheets.helpers({
    employeeprojects: function () {
        const usr = Meteor.user(); // meteor user email address to find and return
        return EmployeeProjects.find({
            "email": usr.emails[0].address
        });
    },
    getDateWorkWeek: function () {
        var today = moment();
        var first_day_year = moment().startOf('year');
        var diff = today.diff(first_day_year, 'days');
        var dayOfYear = ((today - first_day_year + 86400000) / 86400000);
        return Math.ceil(dayOfYear / 7);
    },
    getYear: function () {
        var year = moment().format('YYYY');
        return year;
    },
});
Template.myDashboard.events({
    'click .logout': function (event) {
        event.preventDefault();
        // calling Meteor.logout function from account-password package and printing error in console
        Meteor.logout(function (err) {
            console.log(err);
        });
        Router.go('Login'); // redirect users to login page as soon as they log out.
    },

    'submit form': function (event) {
        event.preventDefault();
        //const selectElem = event.currentTarget;
        var eProjects = document.getElementById("projectOptionsDash");
        var selectElem = eProjects.options[eProjects.selectedIndex].value;
        var showAllProj = false;
		console.log(selectElem);
        if (selectElem == "Select Project") {
            showAllProj = true;
        }
		else{
			showAllProj = false;
		}
		
        var weekValue = document.getElementById("week").value
        console.log(weekValue);
        weekValue = weekValue.slice(-2);
        console.log(weekValue);
        if (showAllProj == true) {
            console.log("Showing results for all project");
            // all proj
            var records = Timesheet.find({
                "userid": Meteor.userId()
            });

            var project = selectElem; // this needs to be user selectable

            // get the workweek
            var myweek = weekValue; //getDateWorkWeek();
            var data_week = '';
            var mon = 0;
            var tue = 0;
            var wed = 0;
            var thu = 0;
            var fri = 0;
            var myLabels = [];
            var totalByProjects = [];
            var count = 0;
            records.forEach(function (doc) {
                console.log(doc.week);
                if (doc.week == myweek && doc.project != "Select Options") {
                    count++;
                    var total = 0;
                    // insert for label
                    //console.log(doc.project);
                    myLabels.push(doc.project);
                    if (doc.mon > 0) {
                        mon += parseInt(doc.mon);
                        total += parseInt(doc.mon);
                    }
                    if (doc.tues > 0) {
                        tue += parseInt(doc.tues);
                        total += parseInt(doc.tues);
                    }
                    if (doc.wed > 0) {
                        wed += parseInt(doc.wed);
                        total += parseInt(doc.wed);
                    }
                    if (doc.th > 0) {
                        thu += parseInt(doc.th);
                        total += parseInt(doc.th);
                    }
                    if (doc.fri > 0) {
                        fri += parseInt(doc.fri);
                        total += parseInt(doc.fri);
                    }
                    totalByProjects.push(total);
                }

            });
            data_week = totalByProjects;
            console.log("Total for week:");
            console.log(data_week);
            console.log(myLabels);
            if (count < 2) {
                myLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                data_week = [mon, tue, wed, thu, fri];
            }
            const data = {
                labels: myLabels,
                datasets: [{
                    label: 'Timesheet Hours',
                    backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
          ],
                    borderColor: [
            'rgba(255,99,132,1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
                    borderWidth: 1,
                    data: data_week,
        }, ],
            };
            var currentChart;
            if (currentChart) {
                currentChart.destroy();
            } else {
                currentChart = new Chart('myChart', {
                    type: 'pie', //pie
                    data,
                    options: {
                        showAllTooltips: true,
                        responsive: true,
                        events: [],
                        maintainAspectRatio: false,
                    },
                });
            }
			showAllProj = false;
        } else {
            switch (selectElem) {
                case 'Select Project':
                    //show hours by projects for a week
                    break;
                default:
                    console.log("Dash-> ", selectElem);
                    // fetch the data
                    if (selectElem != "Select Project") {
                        var records = Timesheet.find({
                            "userid": Meteor.userId()
                        });
                        var project = selectElem; // this needs to be user selectable

                        // get the workweek
                        var myweek = weekValue; //getDateWorkWeek();
                        var data_week = '';
                        var exitLoop = false;
                        records.forEach(function (doc) {
                            console.log(doc.week);
                            var mon = 0;
                            var tue = 0;
                            var wed = 0;
                            var thu = 0;
                            var fri = 0;
                            if (doc.week == myweek && doc.project == project && exitLoop == false) {
                                if (doc.mon > 0) {
                                    mon = doc.mon;
                                }
                                if (doc.tues > 0) {
                                    tue = doc.tues;
                                }
                                if (doc.wed > 0) {
                                    wed = doc.wed;
                                }
                                if (doc.th > 0) {
                                    thu = doc.th;
                                }
                                if (doc.fri > 0) {
                                    fri = doc.fri;
                                }
                                data_week = [mon, tue, wed, thu, fri];
                                exitLoop = true;
                            }

                        });
                        console.log(data_week);

                        const data = {
                            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                            datasets: [{
                                label: 'Timesheet Hours',
                                backgroundColor: [
                  'rgba(255, 99, 132, 0.2)',
                  'rgba(54, 162, 235, 0.2)',
                  'rgba(255, 206, 86, 0.2)',
                  'rgba(75, 192, 192, 0.2)',
                  'rgba(153, 102, 255, 0.2)',
                ],
                                borderColor: [
                  'rgba(255,99,132,1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(75, 192, 192, 1)',
                  'rgba(153, 102, 255, 1)',
                ],
                                borderWidth: 1,
                                data: data_week,
              }, ],
                        };
                        var currentChart;
                        if (currentChart) {
                            currentChart.destroy();
                        } else {
                            currentChart = new Chart('myChart', {
                                type: 'pie', //pie
                                data,
                                options: {
                                    showAllTooltips: true,
                                    responsive: true,
                                    events: [],
                                    maintainAspectRatio: false,
                                },
                            });
                        }
                    }
                    break;
            }
        }
    },
});
Template.myDashboard.helpers({
    myDashboard: function () {
        //, return all of the users
        return Users1.find({}, {
            sort: {
                createdAt: -1
            }
        });
    },
    timesheet: function (userid) {
        return Timesheet.find({
            "userid": Meteor.userId()
        });
    },
    employeeprojects: function () {
        const usr = Meteor.user(); // meteor user email address to find and return
        return EmployeeProjects.find({
            "email": usr.emails[0].address
        });
    },
});
Template.myDashboardEmail.events({
    'click .update': function (event) {
        console.log("updating...");
        Meteor.call("updateUserTimesheet", this._id);
    },
});
Template.myDashboardEmail.helpers({
    timesheet: function (userid) {
        // get the email for the selected user
        var user_email = Router.current().params.query.email;
        user_email = user_email.replace(/\s+/g, "");
        // get user id by email:
        var records = Users1.find({
            "email": user_email
        });
        var userID = '';
        records.forEach(function (doc) {
            userID = doc._id;
        });
        //console.log(userID);
        //return Timesheet.find({
        //  "email": user_email
        return Timesheet.find({
            "userid": userID
        });
    },
});
Template.last30.events({
    // 'click .timesheet-submit-button'(event, instance) {
    'submit form'(event, instance) {
        var dateInput = $('#date').val();
        var projectName = $('#project').val();
        var roleInput = $('#role').val();
        var timeComp = $('#timeComp').val();
        var startTime = $('#start').val();
        var endTime = $('#end').val();
        var totalHr = $('#totalHr').val();
        var normal = $('#normal').val();
        var overInput = $('#overtime').val();
        var sickDays = $('#sick').val();
        var desc = $('#description').val();
        last30db.insert({
            "date": dateInput,
            "project": projectName,
            "role": roleInput,
            "timeComp": timeComp,
            "startTime": startTime,
            "endTime": endTime,
            "totalHr": totalHr,
            "normal": normal,
            "overtime": overInput,
            "sick": sickDays,
            "description": desc
        });
        $('#date').val('');
        $('#project').val('');
        $('#role').val('');
        $('#timeComp').val('');
        $('#start').val('');
        $('#end').val('');
        $('#totalHr').val('');
        $('#normal').val('');
        $('#overtime').val('');
        $('#sick').val('');
        $('#description').val('');
    }
});
Template.viewTime.helpers({
    viewLast() {
        return last30db.find();
    }
});
/* auditor utilities -----------------------------------------------------*/
Template.AuditorRegistration.events({
    'submit form': function (event) {
        event.preventDefault();
        var email = document.getElementById("regEmail");
        var auditorData = {
            username: event.target.regEmail.value,
            email: event.target.regEmail.value,
            password: event.target.regPassword.value,
            profile: {
                email: email,

            },
        }
        Accounts.createUser(auditorData, function (error) {
            if (Meteor.user()) {
                console.log(Meteor.userId());
                // assign business role by default
                Tracker.autorun(function () {
                    var user = Meteor.user();
                    if (user && !Roles.getRolesForUser(user).length) {
                        Meteor.call('addUserRoleAuditor', user);
                    }
                });
                //Router.go('login');
                console.log("Registation completed!.");
                Router.go('Login');
                //document.location.reload(true);
                console.log("ERROR: " + error.reason);
                alert(error.reason);
            }
        });
    }
});


/*  CANDIDATES FOR DELETION  */
/*Template.AdminListDB.helpers({
  admin() {
    return admindb.find();
  }
});*/

/*Template.empRegister.events({
  'click .emp-save'(event, instance) {
    var first = $('#firstName').val();
    var last = $('#lastName').val();
    var middle = $('#middleName').val();
    var registerUser = $('#registerUser').val();
    var password = $('#password').val();
    var registerB_Email = $('#registerB_Email').val();
    var registerPhone = $('#registerPhone').val();
    var registerAdd = $('#registerAdd').val();
    var registerAdd_2 = $('#registerAdd_2').val();
    var registerCity = $('#registerCity').val();
    var registerState = $('#registerState').val();
    var registerZip = $('#registerZip').val();
    var registerEmpID = $('#registerEmpID').val();
    var registerSSN = $('#registerSSN').val();
    Empdb.insert({
      first: first,
      last: last,
      middle: middle,
      registerUser: registerUser,
      password: password,
      registerB_Email: registerB_Email,
      registerPhone: registerPhone,
      registerAdd: registerAdd,
      registerAdd_2: registerAdd_2,
      registerCity: registerCity,
      registerState: registerState,
      registerZip: registerZip,
      registerEmpID: registerEmpID,
      registerSSN: registerSSN
    });
    $('#firstName').val('');
    $('#lastName').val('');
    $('#middleName').val('');
    $('#registerUser').val('');
    $('#password').val('');
    $('#registerB_Email').val('');
    $('#registerPhone').val('');
    $('#registerAdd').val('');
    $('#registerAdd_2').val('');
    $('#registerCity').val('');
    $('#registerState').val('');
    $('#registerZip').val('');
    $('#registerEmpID').val('');
    $('#registerSSN').val('');
  }
});*/

/*Template.empRegisterView.helpers({
  userslist: function() {
    //, return all of the users
    return Users1.find({}, {
      sort: {
        createdAt: -1
      }
    });
  },
  employeeprojects: function(user) {
    //return all of the registered projects for email id
    userEmail = user.email;
    return EmployeeProjects.find({
      "email": user.email
    });
    //return EmployeeProjects.find({});
  },
  employeeprojectsemail: function(user) {
    //return all of the registered projects for email id
    userEmail = user.email;
    var projects = EmployeeProjects.find({
      "email": user.email
    });
    firstProject = projects.fetch()[0].project;
    var roleData = getRoleByProject(userEmail, firstProject);
    firstRole = roleData.fetch()[0].role;
    console.log("first: ", firstRole);
    return firstRole;
  }
});*/

/*Template.myDashboard.onRendered(function() {
  fetch the data
  var records = Timesheet.find({
    "userid": Meteor.userId()
  });
  var project = "Vacation"; // this needs to be user selectable
  get the workweek
  var myweek = getDateWorkWeek();
  var data_week = '';
  records.forEach(function(doc) {
    console.log(doc.week);
    if (doc.week == myweek && doc.project == project) {
      data_week = [doc.mon, doc.tues, doc.wed, doc.th, doc.fri];
    }
  });
  console.log(data_week);
  const data = {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    datasets: [{
      label: 'My First dataset',
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)', 'rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)',
      ],
      borderColor: [
        'rgba(255,99,132,1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)',
      ],
      borderWidth: 1,
      data: data_week,
    }, ],
  };
  const myBarChart = new Chart('myChart', {
    type: 'pie',
    data,
    options: {
      maintainAspectRatio: false,
    },
  });
});*/

/*Template.hourJustification.events({
  'click .logout': function(event) {
    event.preventDefault();
    // calling Meteor.logout function from account-password package and printing error in console
    Meteor.logout(function(err) {
      console.log(err);
    });
    Router.go('login'); // redirect users to login page as soon as they log out.
  }
});*/

/*Template.EmployeeRegistration.helpers({
  users: function() {
    //return all of the tasks
    return Users.find({}, {
      sort: {
        createdAt: -1
      }
    });
  }
}); // was register */

import {
    Meteor
} from 'meteor/meteor';
import '../collections/user-collection.js';

Meteor.startup(() => {
    // code to run on server at startup server side create roles if does not exists
    /*Roles.createRole('user');
    Roles.createRole('admin');
    Roles.createRole('business');*/

    // This is needed to send email invites smtp mail server it will login to the
    // gmail in the background and sent the email
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

    process.env.MAIL_URL = "smtps://dcaaproject%40gmail.com:Oakland157@smtp.gmail.com:465";
    /*Email.send({
        from: "dcaaproject@gmail.com",
        to: "abrannock@oakland.edu",
        subject: "Meteor Can Send Emails via Gmail",
        text: "Its pretty easy to send emails via gmail."
    });*/
    //Timesheet.remove({});
    //EmployeeProjects.remove({});

    if (!Meteor.roles.findOne({})) {
        Roles.createRole('user');
        Roles.createRole('admin');
        Roles.createRole('business');
        Roles.createRole('auditor');
    }

    if (0) {
        // clean the table - deletes all the records from a collection
        Meteor.users.remove({}); // clean meteor users table
        Users1.remove({}); // clean local employees table
        EmployeeProjects.remove({});

        // create admin username and password if does not exists
        if (Meteor.users.find().count() === 0) {
            var userId = Accounts.createUser({
                username: 'admin',
                email: 'admin@business.com',
                password: 'admin123',
                profile: {
                    first_name: 'admin',
                    last_name: 'admin',
                    company: 'admin',
                }
            });
        }
    }
});

// Publishing tasks from the server...
// will send the data to the client
/*Meteor.publish("users1", function () {
    return Users1.find({});
});
Meteor.publish("employeeprojects", function () {
    return EmployeeProjects.find({});
});*/

Meteor.methods({

    addUserRole: function (user) { // assign role to user based on their position
        var pos = user.profile.position;
        var role;
        if (pos == 'Admin') {
            Roles.addUsersToRoles(user, 'admin');
        } else if (pos == 'Employee') {
            Roles.addUsersToRoles(user, 'user');
        }
    },

    addUserRoleBusiness: function (user) { // assign role to business by default
        Roles.addUsersToRoles(user, 'business');
    },

    addUserRoleAuditor: function (user) { // assign role to auditor by default
        Roles.addUsersToRoles(user, 'auditor');
    },

    changepwd: function (email, newPassword) { // change password process
        Accounts.setPassword(Accounts.findUserByEmail(email), newPassword);
    },

    addUser: function (userid, first_name, last_name, email, position, phone, address, city, state, zip) { // add a user to the database
        Users1.insert({
            _id: userid,
            fname: first_name,
            lname: last_name,
            email: email,
            position: position,
            phone: phone,
            address: address,
            city: city,
            state: state,
            zip: zip,
            createdAt: new Date(),
        });
    },

    deleteUser: function (userId) { // delete a user from the database
        //var user = Users1.findOne(userId);
        Users1.remove(userId);
        // Users1.remove(userId, { $set: { checked: setChecked} });
    },

    setChecked: function (userId, setChecked) {
        // var user = Users1.findOne(userId);
        Users1.update(userId, {
            $set: {
                checked: setChecked
            }
        });
    },

    updateUserTimesheet: function (recordId) {
        // find the record matching with userid
        var exists = Timesheet.find({
            "_id": recordId
        });
        // find the id that needs the update
        var updateId = '';
        var approval = '';
        exists.forEach(function (doc) {
            updateId = doc._id;
            approval = doc.approval; // previous approval status
        });
        if (approval == "NO") {
            approval = "YES";
        } else {
            approval = "NO";
        }
        console.log("updateID:", updateId);
        console.log("approval:", approval);
        if (updateId) {
            Timesheet.update(updateId, {
                $set: {
                    approval: approval
                }
            });
        }
    },

    addEmployeeToProject: function (emp_email, project, role) {
        EmployeeProjects.insert({
            email: emp_email,
            project: project,
            role: role,
            createdAt: new Date(),
        });
    },

    addDailyHours: function (userid, project, week, monday, tuesday, wednesday, thursday, friday, approval) {
        // find if the record already exists
        console.log(userid);
        console.log(project);
        console.log(week);
        // find the record matching with userid, project and week
        var exists = Timesheet.find({
            $and: [{
                    "userid": userid
        },
                {
                    "project": project
        },
                {
                    "week": week
        },
      ]
        });
        // find the id that needs the update
        var updateId = '';
        exists.forEach(function (doc) {
            updateId = doc._id;
        });
        console.log(updateId);
        if (updateId) {
            console.log("Updating... ", updateId);
            Timesheet.update(updateId, {
                $set: {
                    mon: monday
                }
            });
            Timesheet.update(updateId, {
                $set: {
                    tues: tuesday
                }
            });
            Timesheet.update(updateId, {
                $set: {
                    wed: wednesday
                }
            });
            Timesheet.update(updateId, {
                $set: {
                    th: thursday
                }
            });
            Timesheet.update(updateId, {
                $set: {
                    fri: friday
                }
            });
            Timesheet.update(updateId, {
                $set: {
                    approval: approval
                }
            });
        } else {
            //insert new record
            console.log("Inserting New data...");
            Timesheet.insert({
                userid: userid,
                project: project,
                week: week,
                mon: monday,
                tues: tuesday,
                wed: wednesday,
                th: thursday,
                fri: friday,
                approval: approval,
                createdAt: new Date(),
            });
        }
    },

    sendEmployeeRegistrationEmail: function (to_email) { // email invitation to register
        Email.send({
            from: "dcaagrpt@gmail.com",
            to: to_email,
            subject: "Your Invitation to register!",
            text: "http://localhost:3000/EmployeeRegistration"
        });
        console.log(to_email);
    },

});

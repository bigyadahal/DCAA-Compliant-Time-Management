import {
  Mongo
} from 'meteor/mongo';

// we create a MongoDB collection, so we can use it on both server and client side.
Users1 = new Mongo.Collection('users1');
EmployeeProjects = new Mongo.Collection('employeeprojects');
Timesheet = new Mongo.Collection('timesheet');
admindb = new Mongo.Collection('admindb'); // maybe don't need?
ownerdb = new Mongo.Collection('ownerdb'); // maybe don't need?
Empdb = new Mongo.Collection('Empdb'); // maybe don't need?
last30db = new Mongo.Collection('Last30Days');
expenseSubmit = new Mongo.Collection('expenseSubmit');

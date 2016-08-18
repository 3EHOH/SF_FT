//This code handles all the functionality for the SF Food Truck page

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Session } from 'meteor/session'
import { Template } from 'meteor/templating';
import { Trucks } from '../api/trucks.js';

import './foodTruckDashboard.html';

Session.setDefault('searchQuerying', false);

Template.ftDashboard.onCreated(function bodyOnCreated() {

    GoogleMaps.load();

    this.state = new ReactiveDict();

    //Once the page has successfully connected to the 'trucks' Mongo collection,
    //it populates the map with blue markers on corresponding coordinates of each truck.

    Meteor.subscribe('trucks', function(){

        // We can use the `ready` callback to interact with the map API once the map is ready.
        GoogleMaps.ready('exampleMap', function(map) {

            //This query is optimized to only get the _id, lat, and lng of each truck instead
            //of gathering all the attributes

            var results = Trucks.find({}, {latitude:true, longitude: true, _id:true}).fetch();

            console.log(results.length);

            results.forEach(function (x) {

                var myLatLng = new google.maps.LatLng(x.latitude, x.longitude);
                var marker = new google.maps.Marker({
                    position: myLatLng,
                    map: map.instance,
                    icon:"http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                });

                //This allows us to click on a marker and call a server-side function
                //which populates a modal based on this particular marker's _id
                marker.addListener('click', function() {
                    Meteor.call('getTruckInfo', x._id);
                });
            });
        });
    });
});

Template.ftDashboard.helpers({


    //This function sets the map's zoom and center
    exampleMapOptions: function() {
        
        // Make sure the maps API has loaded
        if (GoogleMaps.loaded()) {
            // Map initialization options
            return {
                center: new google.maps.LatLng(37.773972, -122.431297),
                zoom: 12
            };
        }
    },

    //This returns the value of the 'searchQuerying' session variable,
    // which is used below to reactively update the search field
    'searchQuerying':function(){
        return Session.get('searchQuerying');
    },

    //This populates the table of search results
    'easySearchData':function(){
        if(Session.get('easySearchQuery').trim() == ""){
            Session.set('easySearchQuery', null);
            Session.set('searchQuerying', false);
        }

        //EasySearch default limits to 10. So, 500 will handle any result set at this scale
        Session.set('easySearchResults', TruckSearch.search(Session.get('easySearchQuery'), {limit:500}).fetch());

        return Session.get('easySearchResults');
    },
});


Template.ftDashboard.events({

    //This pops up a modal for searching for trucks by coordinate.
    //This is optimized by a geospatial index on the Mongo Trucks
    //collection. It is supposed to replace nearby blue markers with red ones
    //but that doesn't seem to be working in most cases right now.
    'click .searchLatLng':function() {

        bootbox.dialog({
                title: "Find That Truck!",
                message:
                '<div class="row">  ' +
                    '<div class="col-md-12"> ' +
                        '<form class="form-horizontal"> ' +
                            '<div class="form-group"> ' +
                                '<label class="col-md-2 control-label" for="name">Latitude</label> ' +
                                '<div class="col-md-9"> ' +
                                    '<input id="lat" type="text" placeholder="37.773972"  class="form-control input-md"> ' +
                                '</div> ' +
                            '</div>' +
                        '</form> ' +
                        '<form class="form-horizontal"> ' +
                            '<div class="form-group"> ' +
                                '<label class="col-md-2 control-label" for="name">Longitude</label> ' +
                                '<div class="col-md-9"> ' +
                                    '<input id="lng" placeholder="-122.431297" type="text" class="form-control input-md"> ' +
                                '</div> ' +
                            '</div>' +
                        '</form> ' +
                    '</div>  ' +
                '</div>',
                buttons: {
                    success: {
                        label: "Find It!",
                        className: "btn-success",
                        callback: function () {
                            var lat = $("#lat").val().trim();
                            var lng = $("#lng").val().trim();

                            //This queries the Trucks collection in MongoDB,
                            //which has been optimized with a geospatial index
                            //on the coordinates field.
                            var nearTrucksArray = Trucks.find({location:{
                                                                $near:{
                                                                    $geometry:{
                                                                        type: "Point",
                                                                        coordinates: [lng, lat]
                                                                    },
                                                                    $maxDistance:100
                                                                }
                                                            }}).fetch();

                            //This demonstrates that it does successfully get nearby trucks
                            console.log(nearTrucksArray);


                            Meteor.call('getTruckInfoByCoords', nearTrucksArray);


                            //This is supposed to add red markers, but it isn't working in most cases.
                            GoogleMaps.ready('exampleMap', function(map) {

                                nearTrucksArray.forEach(function (x) {

                                    console.log(x._id);

                                    var myLatLng = new google.maps.LatLng(x.latitude, x.longitude);

                                    var marker = new google.maps.Marker({
                                        position: myLatLng,
                                        map: map.instance,
                                        icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                                    });
                                });
                            });
                        }
                    },

                    cancel: {
                        label: "Cancel",
                        className: "btn-warning",
                        callback: function () {
                            return true;
                        }
                    }
                }
            }
        );
    },

    //This opens the side nav bar, which is code taken from W3Schools and KQED
    'click .openNav'(){
        document.getElementById("mySidenav").style.width = "300px";
    },

    //This closes the side nav bar, which is code taken from W3Schools and KQED
    'click .closebtn'(){
        document.getElementById("mySidenav").style.width = "0";
    },

    //This creates an "instant results" effect when a user
    //types in the search field by querying after each keyup.
    'keyup .searchText':function() {
        var text = $('.searchText').val();
        Session.set('easySearchQuery', String(text));
        if(Session.get('easySearchQuery') != ""){
            Session.set('searchQuerying', true);
        } else {
            Session.set('searchQuerying', true);
        }

    },

    //This handles edge cases not covered by the above keyup function
    'change .searchText':function() {
        var text = $('.searchText').val();
        Session.set('easySearchQuery',  String(text));
        if(Session.get('easySearchQuery') != ""){
            Session.set('searchQuerying', true);
        } else {
            Session.set('searchQuerying', true);
        }
    },

    //Clicking this button pops up the a modal with data about a specific truck
    // based on the _id of its Mongo record/ This button exists in the
    // results table from the text search.
    'click .searchTextBtn':function(evt){
        var truckID = evt.target.getAttribute("id");
        var truckIDObject = new Mongo.ObjectID(truckID);
        Meteor.call('getTruckInfo', truckIDObject);
    }
});


Meteor.methods({

    //This method takes a truck id as a parameter and generates
    //a modal with details about the name (applicant), menu (fooditems),
    //address, schedule (dayshours), and lat/lng coordinates. It is
    // triggered by clicking on a marker or the "more info" button
    // on the search result table
    'getTruckInfo'(id){

        var currentTruck = Trucks.find({_id: id}).fetch();
        var applicant = currentTruck[0].applicant;
        var fooditems = currentTruck[0].fooditems;
        var address = currentTruck[0].address;
        var dayshours = currentTruck[0].dayshours;
        var coordinates = currentTruck[0].location.coordinates;

        bootbox.dialog({
                title: "The Scoop on the Truck.",
                message:
                '<div class="row">  ' +
                    '<div class="col-md-12"> ' +
                        '<form class="form-horizontal"> ' +
                            '<div class="form-group"> ' +
                                '<label class="col-md-2 control-label" for="name">Name</label> ' +
                                '<div class="col-md-9"> ' +
                                    '<input readonly="readonly" type="text" value=" ' + applicant + '"  class="form-control input-md"> ' +
                                '</div> ' +
                            '</div>' +
                        '</form> ' +
                        '<form class="form-horizontal"> ' +
                            '<div class="form-group"> ' +
                                '<label class="col-md-2 control-label" for="name">Food</label> ' +
                                '<div class="col-md-9"> ' +
                                    '<input  readonly="readonly" type="text" value=" ' + fooditems + '" class="form-control input-md"> ' +
                                '</div> ' +
                            '</div>' +
                        '</form> ' +
                        '<form class="form-horizontal"> ' +
                            ' <div class="form-group"> ' +
                                '<label class="col-md-2 control-label" for="name">Loc.</label> ' +
                                '<div class="col-md-9"> ' +
                                    '<input  readonly="readonly" type="text" value=" ' + address + '" class="form-control input-md"> ' +
                                '</div> ' +
                            '</div>' +
                        '</form> ' +
                        '<form class="form-horizontal"> ' +
                            ' <div class="form-group"> ' +
                                '<label class="col-md-2 control-label" for="name">Sched.</label> ' +
                                '<div class="col-md-9"> ' +
                                    '<input  readonly="readonly" type="text" value=" ' + dayshours + '" class="form-control input-md"> ' +
                                '</div> ' +
                            '</div>' +
                        '</form> ' +
                        '<form class="form-horizontal"> ' +
                            ' <div class="form-group"> ' +
                                '<label class="col-md-2 control-label" for="name">Coord.</label> ' +
                                '<div class="col-md-9"> ' +
                                    '<input  readonly="readonly" type="text" value=" ' + coordinates[1] + ' , ' + coordinates[0]  + '" class="form-control input-md"> ' +
                                '</div> ' +
                            '</div>' +
                        '</form> ' +
                    '</div>  ' +
                '</div>',
                buttons: {
                    success: {
                        label: "Yum!",
                        className: "btn-success",
                        callback: function () {
                            return true;
                        }
                    }
                }
            }
        );
    },

    //This method takes an array of trucks generated by
    //a lat/lng coordinate search and returns the names
    //of those trucks in a modal. If there are no nearby
    //trucks, it produces a different message.
    'getTruckInfoByCoords'(trucksArray){

        if (trucksArray.length < 1) {
            bootbox.dialog({
                    title: "The Scoop on the Truck.",
                    message: '<div class="row">  ' +
                    '<div class="col-md-12"> Sorry but we couldn\'t find any nearby trucks! </div> ' +
                    '</div>',
                    buttons: {
                        success: {
                            label: "Yum!",
                            className: "btn-success",
                            callback: function () {
                                return true;
                            }
                        }
                    }
                }
            );
        } else {
            var truckNames = [];
            trucksArray.forEach(function(x){
                truckNames.push(x.applicant);
            });
            bootbox.dialog({
                    title: "The Scoop on the Truck.",
                    message: '<div class="row">  ' +
                    '<div class="col-md-12"> We found these trucks nearby: ' + truckNames.join(', ') + ' </div> ' +
                    '</div>',
                    buttons: {
                        success: {
                            label: "Yum!",
                            className: "btn-success",
                            callback: function () {
                                return true;
                            }
                        }
                    }
                }
            );
        }
    }
});
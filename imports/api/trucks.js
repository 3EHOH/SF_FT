import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

//The Mongo collection of SF food trucks

export const Trucks = new Mongo.Collection('trucks');

//Creates a new collection for ElasticSearch
TruckSearch = new Mongo.Collection('trucksearch');

//ElasticSearch optimized by Mongo text indexes on
//three fields: address, fooditems, applicant.
TruckSearch = new EasySearch.Index({
    collection: Trucks,
    fields: ['address', 'fooditems', 'applicant'],
    engine: new EasySearch.MongoTextIndex(
        {
            sort: function() {
                return { 'applicant': 1, 'address': 1, 'fooditems':1};
            },
        }),
});

//Handles the publish end of Meteor's publish-subscribe model
//for passing data from the server to client.
if (Meteor.isServer) {
    Meteor.publish('trucks', function trucksPublication() {
        return Trucks.find();
    });
}

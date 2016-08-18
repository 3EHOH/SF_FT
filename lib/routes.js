//This handles the route for the food truck page

FlowRouter.route('/ftDashboard', {
    onBeforeAction: function () {
        this.next();
    },
    name:'ftDashboard',
    action: function() {

        BlazeLayout.render('ftDashboard');
    }
});

# SF_FT
Searchable food truck data in San Francisco


# SF_FT

<strong>Searchable food truck data in San Francisco</strong>

<strong>Functional spec:</strong>

  This is a prototype for an interactive San Francisco food truck finder. Users can click markers on a map, enter coordinates in a modal, or use a text search to find their favorite nearby eateries on wheels.

<strong>Technology Used:</strong>

    -Language:
        -JavaScript
    -Libraries:
        -jQuery
        -Bootstrap
        -BootBox
        -Google Maps
        -EasySearch
    -Database Systems:
        -MongoDB
    -Framework:
        -Meteor

<strong>Focus: Front-end vs. Back-end:</strong>

  The focus was divided evenly. 

  Emphasis was placed on creating a front-end that is clean, direct, and simple tool with the user in mind. Media consumers want quick, easy, interactive tools with big buttons. The front-end was also designed specifically with KQED in mind. The links on the nav-bar, the presence of a side nav-bar, as well as the "jumbotron" image and "newsy" headline were created to mimic KQED's style.

  Clicking a map-marker generates a big, bold modal that gives the end-user exactly what information they want to know about any food truck in San Francisco: the name, location, menu, and hours.

  On the back-end, focus was placed on optimizing the databases, so that the reactive components of the front-end would be performant. The dataset of food trucks is indexed on the latitude and longitude fields, and a covered query (https://docs.mongodb.com/manual/core/query-optimization/) was used to fetch that data to populate the map, and for querying nearby trucks.

  Using the EasySearch library and MongoDB text indexes, the app produces performant search results for a food truck's name, address, or menu. This was wedded with functionality to query the database after every keyup, which gives the front-end user a sensation of instant search results.  

<strong>Architectural choices:</strong>

  Given more time, I would improve the way the user interacts with the map. I would have the coordinate search remove all markers except the nearby trucks. I'd also have a MongoDB $geoNear query to find only trucks within the bounds of the map, so that 1) it's more performant, and 2) it's a less overwhelming number of markers for the user.
  
  An additional issue is that on some browsers the map does not display its markers until the user scrolls on it. Several stackoverflow solutions were tried, and with more time, one that works will be found.

<strong>Additional notes:</strong>

  Some style and code was taken from W3Schools and KQED, in order to mimic KQED's site more effectively. Comments in the code denote which pieces came from these sources.

/**
 * Created by Andy on 03/04/2014.
 */
    //Shorthand for URL beginning.
var url = "http://api.themoviedb.org/3/",
    //Shorthand for the API Key.
    key = "0521b0d5cd9191a569a741e1641f1bef",
    //Shorthand for upcoming movie URL.
    upcomingURL = url + 'movie/upcoming?api_key=' + key,
    //Shorthand for nowPlaying URL.
    newURL  = url + "movie/now_playing?api_key=" + key,
    //Shorthand for search URL.
    searchURL = url + "search/movie?query=" + "&api_key=" + key + "&query=",
    //Used to determine whether or not the upcoming page has been accessed, set to true if true. This prevents the app double loading the same movies on the feed.
    upcomingClicked = false,
    //Used to determine whether or not the new releases page has been accessed, set to true if true. This prevents the app double loading the same movies on the feed.
    newClicked = false;
    //Contains the searched value.
    search = "";
    //Page limit for upcoming movies set during endless scroll function
    upcomingLimit = 0,
    //Page limit for searched movies set during endless scroll function
    searchLimit = 0,
    //Page limit for new movies set during endless scroll function
    newLimit = 0,
    //Set current search page for search page prevents duplicate movies
    searchPage = 1,
    //Set current upcoming Page for upcoming page prevents duplicate movies
    upcomingPage = 1,
    //Set current new Release page for new releases page prevents duplicate movies
    nowPage = 1,
    //Holds a page limit to be transferred into one of the limit variables above depending on current page selected
    pageLimit = 0;

$(document).on("mobileinit", function () {
    //register event to cache site for offline use
    cache = window.applicationCache;
    cache.addEventListener('updateready', cacheUpdatereadyListener, false);
    cache.addEventListener('error', cacheErrorListener, false);
    function cacheUpdatereadyListener (){
        window.applicationCache.update();
        window.applicationCache.swapCache();
    }
    function cacheErrorListener() {
        alert('site not availble offline')
    }
});

/**
 * Document Ready function
 */
$(document).ready(function() {
    //////////////////////////////////////////Navigation////////////////////////////////////////////////////////////////
    /**
     * function for loading new page and getting new feed on input box change.
     */
    $("input").bind("change", function(event, ui){
        var clicked = true;
        $("#searchList").empty();
        console.log("The text has been changed.");
        search = $("input").val();
        searchPage = 1;
        pageLimit = 0;
        getFeed(searchURL + encodeURI(search) + "&page=" + 1, searchList, formatList, false);

        $.mobile.changePage($("#results"), "fade");
    });

    /**
     * function for changing page when moving out of input box without changing the text. Does not retrieve feed to save bandwidth
     */
    $("input").bind("blur", function(event, ui){
        $.mobile.changePage($("#results"), "fade");
    });

    /**
     * Upcoming movie getfeed button
     */
    $("#upcoming").bind('click', function() {
        upcomingPage = 1;
        if(upcomingClicked != true) {
            upcomingClicked = true;
            getFeed(upcomingURL + "&page=" + 1, upcomingList, formatList, true);
        }
    });

    /**
     * new releases getfeed button
     */
    $("#new").bind('click', function() {
        nowPage = 1;
        if(newClicked != true) {
            newClicked = true;
            getFeed(newURL + "&page=" + 1, newList, formatList, true);
        }
    });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    /**
     *Function for retrieving the feed from MovieDB.org
     * @param address - URL for the JSONP Feed
     * @param destination - HTML element that the feed should be formatted into
     * @param operation - the format function that should be carried out after the results are relieved from the server
     * @param store - If this is true the feed retrieved will be stored in local storage
     */
    function getFeed(address, destination, operation, store){
        if(navigator.onLine) {
            $.ajax({
                url: address,
                dataType: "jsonp",
                async: true,
                if: (navigator.onLine),
                success: function (result) {
                    operation.parseJSONP(address, result, destination, store);
                    console.log(result);
                    if (store == true) {
                        localStorage.setItem(address, JSON.stringify(result));
                    }
                },
                error: function (request, error) {
                    console.log("Network error occured")
                }
            });
        }
        else{
            var result = JSON.parse(localStorage.getItem(address));
            operation.parseJSONP(address, result, destination, store);
        }

    };

    /**
     * Parses the JSONP and then formats it to display on the page with relevant data.
     * @type {{parseJSONP: parseJSONP}}
     */

    var formatList= {
        parseJSONP:function(address, result, destination, store){
            pageLimit = result.total_pages;
            $.each(result.results, function(i, row) {
                //console.log(JSON.stringify(row));
                $(destination).append('<li><a href="" data-id="' + row.id + '"><img src="http://image.tmdb.org/t/p/w500/'+row.poster_path+'"/><h3>' + row.title + '</h3><p>' + row.vote_average + '/10</p></a></li>');
                $("img").error(function () {
                    $(this).attr('src', 'images/Placeholder.jpg');
                });
                if(store == true) {
                    getFeed("http://api.themoviedb.org/3/movie/" + row.id + "?api_key=0521b0d5cd9191a569a741e1641f1bef", movieData, catchData, true);
                }
            });
            $(destination).listview('refresh');
        }
    };

    /**
     * Parses the JSONP feed for more in-depth movie information on the movie info page
     * @type {{parseJSONP: parseJSONP}}
     */
    var formatMovie ={
        parseJSONP:function(address, result, destination, store){
            console.log(result);
            //Formatting individual movie info
            //THANASSI THIS IS THE PLACE FOR YOU!!
			var g = result.genres;
            $("#movieData").append('<img id="full_poster" src="http://image.tmdb.org/t/p/w500/'+result.poster_path+'"/>');
            $("#movieData").append('<h1 id="full_title">'+result.original_title+'</h1><a class="full_note">Released date:<br> '+result.release_date+'</a><br><a class="full_note">Running time:<br> '+result.runtime+' mins</a><br><br>');
			$("#movieData").append('<div id="full_genre"></div>')
			if(g.length > 0){
                $("#full_genre").append('<img class="genreImage" src="./images/genre/'+g[0].name+'.png"><a class="genreText"><b>'+g[0].name+'</b></a>');
			}
            $("#full_overview").append('<h2>Overview</h2>');
            $("#full_overview").append('<p>'+result.overview+'</p>');
        }
    };



    /**
     * Takes the ID of the clicked movie link then uses it to create a request. Sends the uses getFeed to get the results to format using formatMovie.
     */
    $(document).on('click', '.innerNav li a', function(){
        var currentMovieID = $(this).attr('data-id');
        $("#movieData").empty();
        $("#full_overview").empty();
        $("#genreImages").empty();
        console.log(currentMovieID);
        getFeed("http://api.themoviedb.org/3/movie/"+currentMovieID+"?api_key=0521b0d5cd9191a569a741e1641f1bef",  false, formatMovie, false);
        $.mobile.changePage($("#movieInfo"), "fade");
    });


    /**
     * This function is to prevent the app from formatting every individual piece of movie data when it runs through each prior to saving them.
     * @type {{parseJSONP: parseJSONP}}
     */
    var catchData ={
        parseJSONP:function(result, destination){
            console.log("Caught: " + result);
        }
    };


    /**                                 ENDLESS SCROLL
     * This function adds the functionality of scrolling to the bottom in order to go render the next page.
     * The page id is taken from the current active page and the variable of pageLimit which is a number taken directly from the JSONP feed.
     * The pageLimit variable is then taken and depending on which page is active, a certain variable will be chosen to store the data contained
     * within pageLimit. This prevents sending off invalid requests as once the variable containing the pageLimit has been reached it stops requesting feeds.
     * The rest of the function merely counts the current page and sends off a feed request with a certain page number.
     */
    $(window).scroll(function(pageCount) {
        if($(window).scrollTop() + $(window).height() == $(document).height()) {
            var pageID = $.mobile.activePage.attr('id');

            console.log(pageID);
            if(pageID == "results"){
                searchLimit = pageLimit;
                console.log(searchLimit + " Pages");
                searchPage += 1;
                console.log("Current Page " + searchPage);
                if(searchPage >= 2){
                    if(searchPage <= searchLimit){
                        getFeed(searchURL + encodeURI(search) + "&page=" + searchPage, searchList, formatList, false);
                    }
                    else{
                        console.log("No more pages")
                    }
                }
            }

            else if(pageID == "upcomingMovies"){
                upcomingLimit = pageLimit;
                console.log(upcomingLimit + " Pages");
                upcomingPage += 1;
                console.log("Current Page " + upcomingPage);
                if(upcomingPage >= 2){
                    if(upcomingPage <= upcomingLimit){
                        getFeed(upcomingURL + "&page="+ upcomingPage, upcomingList, formatList, true);
                    }
                    else{
                        console.log("No more pages")
                    }
                }
            }

            else if(pageID == "newReleases"){
                newLimit = pageLimit;
                console.log(newLimit + " Pages");
                nowPage +=1 ;
                console.log("Current Page " + nowPage);
                if(nowPage >= 2){
                    if(nowPage <= newLimit){
                        getFeed(newURL + "&page="+ nowPage, newList, formatList, true);
                    }
                    else{
                        console.log("No more pages")
                    }
                }
            }
        }
    });
});

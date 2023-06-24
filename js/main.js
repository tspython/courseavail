
"use strict";
var term = 0;
var termhr = '';
var career = 'ugrad';
var pages = ['schedule','watchlist','history','shared','export'];
var persisted ='';
var incrementer =0;
var user = '';
var intvlID = 0;
var defaultPage = 'schedule';
var watchlistPlanName = 'sc_watchlist';
var debugHist = [];

	var wsroot = "/apps/ws/courseavail";
	var pageroot = "";

$(document).ready(function() {
	window.currentState = 1;
	
	window.localDB = new CourseDB();
	window.searches = new Searches('searches-container');
	window.plans = new PlanCollection();
	window.watchlist = new Plan(watchlistPlanName,0);

	try {
		if (typeof $.cookie('ca2-dhist') !== 'undefined' && $.cookie('ca2-dhist')!= ''){
			window.debugHist = json_parse($.cookie('ca2-dhist'));
		}
	} catch(e) { /*ignore*/ } 
	
	loading();

	$.ajax({ url: wsroot+"/auth/check", 
		success: function( data ) {
	
		if ( data.results.authenticated) {
			window.user = data.results.user;
			$('.userText').html(window.user);
			$('.guestOpts').hide();
			$('.loggedInOpts').show();
			$('#link_logout').prop('href',data.results.logoutURL);
			persisted = new PersistDB( main );					
			
		} else {
			$('.guestOpts').show();
			$('.loggedInOpts').hide();
			window.loginURL = data.results.loginURL;
			main();
		}
	}});
	var modo = getUrlParameter('modo');
	if ( modo != null || (typeof $.cookie('isModo') !== 'undefined' && $.cookie('isModo')!= '') ) {
		$('.navbar-brand').hide();	
		console.log('modo');
		$.cookie('isModo',1, { expires: 90 });
	}
});



$(document).on('click','.navbar-collapse.in',function(e) {
    if( $(e.target).is('a') && $(e.target).attr('class') != 'dropdown-toggle' ) {
        $(this).collapse('hide');
    }
});

function main() {

	ws("autocomplete/quarters", "",
	  function( data ) {
		 
		var newest = data.results.currdef.value;	
		
		//if a term is specified in the URL, use that one
		var termQS = getUrlParameter('t');
		if ( termQS != null ) {
			newest = termQS;
		}
		if (persisted=='') {
			persisted = new PersistCookie(newest);	
		}
		
		if ( isLoggedIn()) {
			//check if there are local plans, and if so, append it to the saved ones
			var localPlans = new PersistCookie(persisted.getTerm());

			
			if ( localPlans.getWatchlist() != '' || localPlans.getPlans() != '' || localPlans.getSearches() != '') {
				
				var local = localPlans.getPlans();
				var db = escape(JSON.stringify(persisted.getPlans()));				
				persisted.mergePlanColl(localPlans.getPlans());
				persisted.mergeWatchlist(localPlans.getWatchlist());
				persisted.mergeSearches(localPlans.getSearches());
				persisted.savePackage(); 
				localPlans.clearAll(); 
				var safter =  escape(JSON.stringify(persisted.getPlans()));
			}	
		}
		
		term = persisted.getTerm();
		career = persisted.getCareer();
		updateCareerBtns();
		
		var dropd = $('#availableQuarters');
		$.each(data.results.indb,function(key, otf) {
			if ( /^\d{4}$/.test(otf.value) && otf.value <= 4460 ){
				if ( otf.value == term ) {
					termhr = otf.label;
					$('#qtitle').html((otf.label==''?'Quarter':otf.label));	
					$('#selectedQtext').html('Quarter: ' + otf.label);					
					 dropd.append('<li class="active"><a href="?q='+otf.value+'">'+otf.label+'</a></li>');
				} else {
					 dropd.append('<li><a href="?q='+otf.value+'">'+otf.label+'</a></li>');
				}
			}
		});
		
		if ( persisted.getPlans() != '' ) {	
			plans.buildFromSerialized(persisted.getPlans(),function(){
				if ( persisted.getWatchlist() != '' ) {	
					watchlist.buildFromSerialized(persisted.getWatchlist() ,function(){
						//watchlist.highlight();	
						afterDataLoaded();
					});
				} else {
					afterDataLoaded();
				}				
			});
		} else {
			afterDataLoaded();	
		}
	});	
	

}

function afterDataLoaded() { //plans and watchlist, and course info have all been loaded
	doneloading();
	var classQS = getUrlParameter('class');
	var shareQS = getUrlParameter('shared');
	
	if ( classQS != null ) {
		var showDetCrse = new Course(classQS,true);

 		showDetCrse.hideLink =1;
		var htm = render('templ-courseDetails',showDetCrse);	
		$('#main').html('<div class="featherlight-content">'+htm+'</div>');
		//buildInsetMap($('#cdetailmap'),showDetCrse.lat,showDetCrse.long,'350px',showDetCrse.mtg_facility_1);

		return;
	} else if ( shareQS != null) {		
		goToPage('shared',false, function() {
			var tpackage = json_parse(shareQS);
			var sharedPlans = new PlanCollection();			
			sharedPlans.buildFromSerialized([tpackage],function() {
				$('#planShared').html( render('templ-sharedSched',{ p: sharedPlans.allplans}));
			});
		});
	} else {
		goToPage(persisted.getPage() ,false,function() {
			var state = history.state;
			//handle page refresh since it doesnt trigger a pop state
			if( state && state.action == 'search') { //performance.navigation.type  == 1  &&
				searches.populateFormParams(state.params);
				searches.execute(false);		
			} else {
				doReplaceState('?p='+persisted.getPage());
			}
		});
			
	}

}

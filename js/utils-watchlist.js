function addToWatchlist(id) {
	watchlist.addCourseBypass(id);
	if ( persisted.getPage() == 'watchlist' ) {
		buildWatchlistPage();	
	}
}		

function removeFromWatchlist(id) {
	watchlist.removeCourse(id);
	if ( persisted.getPage() == 'watchlist' ) {
		buildWatchlistPage();	
	}

}		

function buildWatchlistPage() {
	if ( plans.isEmpty() && watchlist.isEmpty() ) {
		$('#watchlistEmpty').show();
	} else {
		$('#watchlistEmpty').hide();
	}
	
	$('#planWatch').html( render('templ-watchlist',{w:[watchlist],p:plans.allplans}));
	
}

function refreshSeats() {
	//This function deprecated for workday
	return;
	
	var dataList = $(".seats_num").map(function() {
		return $(this).data("cnbr");
	}).get();

	if ( dataList.length  > 0 ) {

		ws("seats",  dataList.join(",") ,function(data) {
			
			for( c=0; c< data.results.length; c++) {		
				cn = data.results[c].sectionUID;
				sts = data.results[c].seatsRemaining;
				elmt = $(".seats_num[data-cnbr='"+cn+"']");
				if ( isNumber(sts) && sts > 0 ) {
					//elmt.removeClass('seats-');
					sts = '<span class="label label-default">'+sts+' seats</span>';
				} else {
					//elmt.addClass('seats-');
					sts = '<span class="label label-danger">closed</span>';
				}
				elmt.fadeOut('fast').html(sts).fadeIn().switchClass("hgh-normal","hgh-green",160).switchClass("hgh-green","hgh-normal",160)
			}				
		});
	}
}

function changeInvl(setto) {
	clearInterval(intvlID);	
	$('.intvl_btn').removeClass('active');
	$('#i_'+setto).addClass('active');
	if (setto == 'off') {
		intvlID = 0;
		return void(0);
	} 
	if ( setto < 30 ) 
		setto = 30;
	
	refreshSeats();
	intvlID = setInterval(	refreshSeats , setto * 1000);
	
	return void(0);	
}


function watchlist_init() {
	buildWatchlistPage();

	if ( intvlID == 0 ) {
		intvlID = setInterval(	refreshSeats , 90000);
	}

}
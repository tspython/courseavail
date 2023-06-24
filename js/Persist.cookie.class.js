

function PersistCookie (defaultTerm) {
	this._page = defaultPage;
	this._career = 'ugrad';
	this._package = {};	
	this._term = defaultTerm;	
	this._plans = '';	
	this._watchlist = '';	
	this._searches = '';	

	if (typeof $.cookie('ca2-term') !== 'undefined' && $.cookie('ca2-term')!= '') {
		this._term = $.cookie('ca2-term');	
		 
	}
	var qparam = getUrlParameter('q');
	if ( qparam  != null ) {
		this.setTerm(qparam);	
	}

	if (typeof $.cookie('ca2-car') !== 'undefined' && $.cookie('ca2-car')!= '') {
		this._career = $.cookie('ca2-car');	
	}
	var cparam = getUrlParameter('c');
	if ( cparam  != null ) {
		this.setCareer(cparam);	
	}
	
	if (typeof $.cookie('ca-pg') !== 'undefined' && $.cookie('ca-pg')!= ''){
		this._page  = $.cookie('ca-pg');
	}
	this.fetchPackage();
	
}

PersistCookie.prototype.fetchPackage = function() {
	if (typeof $.cookie('ca2-tp-'+this._term) !== 'undefined' && $.cookie('ca2-tp-'+this._term) != '') {
		this._package = $.cookie('ca2-tp-'+this._term);

		
		parsed = json_parse(this._package);
		if (parsed) {
			this._plans = parsed.plans;	
			this._watchlist = parsed.watchlist;	
			this._searches = parsed.searches;	
		} else {
			console.log('Error parsing persisted cookie: ' + $.cookie('ca2-tp-'+this._term));	
		}
	} else {
		this._plans = '';	
		this._watchlist = '';	
		this._searches = '';			
	}

}


PersistCookie.prototype.getTerm = function() {
	return this._term;
}
PersistCookie.prototype.setTerm = function(setto) {
	this._term = setto;
	$.cookie('ca2-term',setto, { expires: 45 });
	this.fetchPackage();
}

PersistCookie.prototype.getCareer = function() {
	return this._career;
}
PersistCookie.prototype.setCareer = function(setto) {
	if ( setto != this._career ) { 
		this._career = setto;
		window.career = setto;
		$.cookie('ca2-car',setto, { expires: 45 });
	} 
}

PersistCookie.prototype.getPage = function() {
	return this._page;
}
PersistCookie.prototype.setPage = function(setto) {
	this._page = setto;
	$.cookie('ca-pg',setto, { expires: 45 });

}

PersistCookie.prototype.getPlans = function() {
	return this._plans;
}
PersistCookie.prototype.setPlans = function(setto) {
	this._plans = setto;
	this.savePackage();

}
PersistCookie.prototype.getWatchlist = function() {
	return this._watchlist;
}
PersistCookie.prototype.setWatchlist = function(setto) {
	this._watchlist = setto;
	this.savePackage();
}

PersistCookie.prototype.getSearches = function() {
	return this._searches;
}
PersistCookie.prototype.setSearches = function(setto) {
	this._searches = setto;
	this.savePackage();
}

PersistCookie.prototype.savePackage  = function () {
	packed = {
			plans:this._plans,
			watchlist:this._watchlist,
			searches:this._searches
		};
	savedPopper();
	
	$.cookie('ca2-tp-'+this._term, JSON.stringify(packed), { expires: 45 } );
	addDebug('save cookie');

}

PersistCookie.prototype.clearAll = function(setto) {
	addDebug('clear all');
	document.cookie.split(/; */).forEach(function(cookieraw){
	  var cookie  = cookieraw.split('=');
		if ( cookie[0].substr(0,4) == 'ca2-') {
			$.cookie(cookie[0],'', { expires: 45 });
		}
	});
}

PersistCookie.prototype.setShownDisclaimer = function(setto) {
	$.cookie('ca-disclaimer',1, { expires: 45 });
}

PersistCookie.prototype.hasSeenDisclaimer = function(setto) {	
	if (typeof $.cookie('ca-disclaimer') == 'undefined'){
		return false;
	}
	return true;

}

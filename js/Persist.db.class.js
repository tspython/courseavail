

function PersistDB (callbackFunc) {
	expArg = null;
	var qparam = getUrlParameter('q');
	var cparam = getUrlParameter('c');
	if ( qparam  != null ) {
		this._term = qparam;
		window.term = qparam;	
		expArg = 'update_term';
	}
	if ( cparam  != null ) {
		this._career = cparam;	
		window.career = cparam;
		expArg = 'update_career';
	}
	selfref = this;
	ws('user_storage/fetch',expArg,function( data ) { 
			obj = data.results;

			selfref._page = typeof obj.view.page === 'undefined' || obj.view.page == ''  || obj.view.page == null? defaultPage : obj.view.page;
			selfref._career = typeof obj.view.career === 'undefined' || obj.view.career == '' || obj.view.career == null? 'ugrad' : obj.view.career;
			selfref._package = typeof obj.content.package === 'undefined' || obj.content.package == '' || obj.content.package == null? '' : obj.content.package;
			selfref._term = obj.view.term;	
			selfref._plans = [];	
			selfref._watchlist = [];	
			selfref._searches = [];	
			
			selfref.unpack();
		
			if ( obj.view.term ) {
				window.term = obj.view.term;	
			}
			
			callbackFunc();
	});
	
}	


PersistDB.prototype.unpack = function() {
	parsed = json_parse(this._package);
	if (parsed) {
		this._plans = parsed.plans;	
		this._watchlist = parsed.watchlist;	
		this._searches = parsed.searches;	
	}
}


PersistDB.prototype.getTerm = function() {
	return this._term;
}
PersistDB.prototype.setTerm = function(setto) {
	if ( setto != this._term ) { 
		this._term = setto;
		this.saveView();
	}

}

PersistDB.prototype.getCareer = function() {
	return this._career;
}
PersistDB.prototype.setCareer = function(setto) {
	if ( setto != this._career ) { 
		this._career = setto;
		window.career = setto;
		this.saveView();
	}
}

PersistDB.prototype.getPage = function() {
	return this._page;
}
PersistDB.prototype.setPage = function(setto) {
	if ( setto != this._page ) { 
		this._page = setto;
		this.saveView();
	}
}

PersistDB.prototype.getPlans = function() {
	return this._plans;
}
PersistDB.prototype.setPlans = function(setto) {
	this._plans = setto;
	this.savePackage();
}

PersistDB.prototype.mergePlanColl = function(coll) {
	parsed = json_parse(coll);	
	if (parsed) {
		for ( var i=0; i < parsed.length; i ++ ) {
			append = 0;
			for ( var k=0; k < this._plans.length; k ++ ) {
				parts = this._plans[k].name.split('[');
				if ( parts[0] == parsed[i].name ) {
					append++;	
				}
			}
			if (append != 0) {
				parsed[i].name += '['+append+']';
			}
			this._plans.push(parsed[i]);
		}
	}
}

PersistDB.prototype.mergeWatchlist = function(coll) {
	parsed = json_parse(coll);
	if (parsed && parsed.courses)  {
		if ( !this._watchlist.courses) {
			this._watchlist = new Plan(watchlistPlanName,0);
		}
		for ( var i=0; i < parsed.courses.length; i ++ ) {
			unique = true;
			for(e=0; e< this._watchlist.courses.length; e++) {
				if (this._watchlist.courses[e] == parsed.courses[i]) {
					unique = false;
				}
			}
			if (unique) {
				this._watchlist.courses.push(parsed.courses[i]);
			}
		}
	}
}

PersistDB.prototype.mergeSearches = function(coll) {
	parsed = json_parse(coll);

	if (parsed) {
		for ( var i=0; i < parsed.length; i ++ ) {
			unique = true;
			for(e=0; e<this._searches.length; e++) {
				if (this._searches[e].id == parsed[i].id) {
					unique = false;
				}
			}
			if (unique) {
				this._searches.push(parsed[i]);
			}
		}
	}
}

PersistDB.prototype.getWatchlist = function() {
	return this._watchlist;
}
PersistDB.prototype.setWatchlist = function(setto) {
	this._watchlist = setto;
	this.savePackage();
}

PersistDB.prototype.getSearches = function() {
	return this._searches;
}
PersistDB.prototype.setSearches = function(setto) {
	this._searches = setto;
	this.savePackage();
}

PersistDB.prototype.savePackage  = function () {

	contentOb = {};
	res = json_parse(this._plans);
	wres = json_parse(this._watchlist);
	sres = json_parse(this._searches);
	if ( res ) 	contentOb.plans = res;	 	else	contentOb.plans = this._plans;
	if ( wres ) contentOb.watchlist = wres; else	contentOb.watchlist = this._watchlist;
	if ( sres ) contentOb.searches = sres; 	else	contentOb.searches = this._searches;

	packed = {
			page: this._page,
			term: this._term,
			career: this._career,
			content:JSON.stringify(contentOb)
		};
	
	ws('user_storage/write',packed,function() {  
		savedPopper();
		
	 },'post');

	addDebug('save db');
	doneloading();
}

PersistDB.prototype.saveView  = function (callback) {
	packed = {
		page: this._page,
		term: this._term,
		career: this._career,
	 };	

	ws('user_storage/updateview',packed,callback,'post');
	
}


PersistDB.prototype.clearAll = function(setto) {
	document.cookie.split(/; */).forEach(function(cookieraw){
	  var cookie  = cookieraw.split('=');
		if ( cookie[0].substr(0,4) == 'ca2-') {
			$.cookie(cookie[0],'');
		}
	});
}

PersistDB.prototype.setShownDisclaimer = function(setto) {
	$.cookie('ca-disclaimer',1, { expires: 30 });
}

PersistDB.prototype.hasSeenDisclaimer = function(setto) {	
	if (typeof $.cookie('ca-disclaimer') == 'undefined'){
		return false;
	}
	return true;

}




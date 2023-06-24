var numSearchesToKeep = 7;

function Searches (parentDiv) {
	this.container = parentDiv;
	this.wsResp = [];
	this.collection = [];
	this.rowspp = 50;
}

Searches.prototype.execute_autosel = function(event, ui) {
	$( "#oneSearch" ).val(ui.item.value);
	searches.execute();	
	return void(0);
}

Searches.prototype.clear = function() {
	this.collection =[];
	$( "#oneSearch" ).val("");
	
	this.rebuildRecentList();
	persisted.setSearches(this.serialize());	
	$('#rc_title').html('No Recent Searches');
	doReplaceState("");
	
}


Searches.prototype.execute = function(replaceState) {
	replaceState = def(replaceState,true);
	
	//build params from all searchForm inputs, except omit the maxRes field since we will throw an error if the search is empty
	params = $("#searchForm input,#searchForm select").filter(function(index, element) {
		if ( $(element).prop('id') == 'maxRes') return false;
        return ($(element).val() != "" || $(element).prop('checked') );
    }).serialize();
	if ( params.trim() == '' ) {
		error("Please enter a search term or add filters");
		return;	
	}
	params += '&maxRes=' + $('#maxRes').val();
	
	ws('search',params,function(data) { 
		searchID = hash(JSON.stringify(params)).toString().substring(0,5);

		foundIndex = searches.findSearchByID(searchID);
		if ( foundIndex != -1 ) {		
			searches.collection.splice(foundIndex,1);
		}
		searches.collection.unshift({id:searchID,qt:data.title,params:params.replace("&maxRes=100", "")});
		searches.collection = searches.collection.slice(0, numSearchesToKeep);
		searches.addGroup(data,false);
		searches.rebuildRecentList();
	},'post');

	if ( replaceState ) {
		doReplaceState('?p='+persisted.getPage(),{action:'search',params:params});
	}
	//	doPushState('?p=catalog');

	return void(0);
}


Searches.prototype.findSearchByID = function(newid) {
	for(e=0; e<this.collection.length; e++) {
		if ( this.collection[e].id == 	newid) {
			return e;
		}
	}
	return -1;
}

Searches.prototype.serialize = function() {
	return JSON.stringify(this.collection );
}

Searches.prototype.remove = function(remid) {
	$('#group'+remid).slideUp({done: function() { $(this).remove(); }});

    found = -1;
	for(var i = 0; i < this.collection.length; i++) {
		if ( this.collection[i].id == 	remid) {
			found = i;
			break;
		}
	}
	if ( found >= 0 ) {
	  this.collection.splice(found, 1);	
	}

	searches.trigger_change();
	return void(0);
}

Searches.prototype.disableConflictsInResults = function() {

	cplan = plans.getCurrent();
	
	$('.classAddBtn').addClass("plan-addable").removeClass("plan-prohibit").removeClass("in-plan");	
	for( m=0; m < cplan.courses.length; m++) {		
		thisCourseCA = cplan.courses[m].getConflictArray();
		thisCourseSTR = cplan.courses[m].getString();

		$('.classAddBtn').each(function() {
			cnbr = $(this).data('cnbr');
			bufferCrse = new Course(cnbr);
			if ( thisCourseSTR == bufferCrse.getString() ) {
				$(this).addClass('plan-prohibit').removeClass('plan-addable');
			}
			
			bufferCA = bufferCrse.getConflictArray();
			if ( casOverlap(thisCourseCA, bufferCA) ) {
				$(this).addClass('plan-prohibit').removeClass('plan-addable');
			}
			bufferCA = null;
			bufferCrse = null;
		});
	}
	for( m=0; m < cplan.customs.length; m++) {		
		thisCustomCA = cplan.customs[m].getConflictArray();

		$('.classAddBtn').each(function() {
			cnbr = $(this).data('cnbr');
			bufferCrse = new Course(cnbr);
			bufferCA = bufferCrse.getConflictArray();
			if ( casOverlap(thisCustomCA, bufferCA) ) {
				$(this).addClass('plan-prohibit').removeClass('plan-addable');
			}			
			bufferCA = null;
		});
	}
	for( m=0; m < cplan.courses.length; m++) {		
		$('.classAddBtn[data-cnbr='+cplan.courses[m].sectionUID+']').removeClass('plan-addable').removeClass('plan-prohibit').addClass('in-plan');		
	}
	
	$('.btn-add-watchlist').show();
	$('.btn-in-watchlist').hide();
	for( m=0; m < watchlist.courses.length; m++) {		
		$('.btn-add-watchlist[data-cnbr='+watchlist.courses[m].sectionUID+']').hide();		
		$('.btn-in-watchlist[data-cnbr='+watchlist.courses[m].sectionUID+']').show();		
	}
	
};


Searches.prototype.trigger_change = function() {
	persisted.setSearches(this.serialize());
}

Searches.prototype.rebuildRecentList = function() {
	elmt = $('#rc_list');
	elmt.html('');
	if ( this.collection.length > 0 ) {
		$('#rc_title').html('Recent Searches: &nbsp; <a href="javascript:searches.clear();" class="small">clear</a>');
	}
	for( var w=0; w<this.collection.length; w++) {		
		if ( w > 5 ) {
			break;
		}	
		
		if ( this.collection[w].hasOwnProperty("qt") && this.collection[w].qt ) {
			elmt.append('<li data-id="'+this.collection[w].id+'">'+this.collection[w].qt.replace(/<\/?[^>]+(>|$)/g, "")+'</li>');
		}
	}	
	$('#rc_list li').off('click');
	$('#rc_list li').click(function() {
		searches.redo($(this).data('id'));		
	});
}

Searches.prototype.redo = function(searchID) {
	ind = this.findSearchByID(searchID);
	if (ind == -1 ) {
		error("Sorry, there was an error finding the recent search");
		return;
	}
	
	p = searches.collection[ind].params;
	this.populateFormParams(p);
	this.execute();
}

Searches.prototype.populateFormParams = function(paramsStr) {
	pArr = paramsStr.split('&');
	clearAdv();
	$('#oneSearch').val('');

	for (var k=0; k < pArr.length; k++ ) {
		parts = pArr[k].split('=');	
		if (parts.length == 2 && parts[1].length > 0 ) {
			if (parts[0] == 'q') {
				$('#oneSearch').val(parts[1].replace(/\+/g, ' '));
			} else if (parts[0] == 'openseats')  {
				$('#advSeats').prop('checked',true);
			} else if (parts[0] == 'days_require')  {
				daysArr = parts[1].replace("%2C",",").split(',');
				for (s=0;s<daysArr.length;s++) { 
					markDay(daysArr[s],'y'); 
				}
			} else if (parts[0] == 'days_not')  {
				daysArr = parts[1].replace("%2C",",").split(',');
				for (s=0;s<daysArr.length;s++) { 
					markDay(daysArr[s],'n');
				}
			} else {
				$('[name='+parts[0]+']').val(parts[1]);
			}
		}
	}
	this.rebuildAdvancedSummary();

}

Searches.prototype.rebuildAdvancedSummary = function() {
	ctr = $('#advSummary');
	ctr.html('');
	vals = render('templ-advSummary', {id:'advSchool',label:'School', value:$('#advSchool').val()}) +
		render('templ-advSummary', {id:'advSubject',label:'Department', value:$('#advSubject').val()}) +
		render('templ-advSummary', {id:'advCore',label:'Core', value:$('#advCore').val()}) +
		render('templ-advSummary', {id:'advCore2',label:'Core', value:$('#advCore2').val()}) +
		render('templ-advSummary', {id:'advModality',label:'Modality', value:$('#advModality').val()}) +
		render('templ-advSummary', {id:'advStTime',label:'Starts After', value:$('#advStTime').val()}) +
		render('templ-advSummary', {id:'advEnTime',label:'Ends before', value:$('#advEnTime').val()}) +
		render('templ-advSummary', {id:'advInstr',label:'Instructor', value:$('#advInstr').val()}) +		
		render('templ-advSummary', {id:'advDaysReq',label:'Meets on', value:$('#advDaysReq').val()})+
		render('templ-advSummary', {id:'advDaysNot',label:'Does not meet on', value:$('#advDaysNot').val()})+
		render('templ-advSummary', {id:'advMinUnits',label:'Minimum Units', value:$('#advMinUnits').val()}) +
		render('templ-advSummary', {id:'advMaxUnits',label:'Maximum Units', value:$('#advMaxUnits').val()}) +
		render('templ-advSummary', {id:'advSeats',label:'', value: ($('#advSeats').prop('checked')?'Has Seats':'')});
	if (vals.trim() != '' ) {
		ctr.html(vals+' <a href="javascript:clearAdv()">clear</a>');	
	}
}

Searches.prototype.buildFromSerialized = function(str) {
	if ( str[0].id ) {
		var ob =str;
	} else {
		try {
			var ob = JSON.parse(str);
		} catch (e) {
			return false;
		}	
    }	
	
	for( w=0; w<ob.length; w++) {		
		if ( this.findSearchByID(ob[w].id) ==-1 && ob[w].hasOwnProperty("qt")) {		
			searches.collection.push({id:ob[w].id,qt:ob[w].qt,params:ob[w].params});		
		}
	}	
}
 
Searches.prototype.addGroup = function(data,inclsub,skipAnim,skipChangeTrig) {
	skipAnim = def(skipAnim,false);
	skipChangeTrig = def(skipChangeTrig,false);
	localDB.insertCourses(data.results);
	incrementer++; 

	this.wsResp = data;
	this.paginate();
	this.goto(1);
	this.disableConflictsInResults();
	goToState(2,skipAnim);   
	
	
	if ( !skipChangeTrig) 
		searches.trigger_change();

};

Searches.prototype.paginate = function() {
	paghtm ='<div class="small">';
	if ( this.wsResp.results.length == $('#maxRes').val() ) {
		paghtm+='More than ';	
	}
	paghtm += this.wsResp.results.length + ' classes found. <span id="viewing"></span></div>';
	numpages = Math.ceil(this.wsResp.results.length/this.rowspp);
	if ( numpages > 1 ) {
		for (var p=1; p<=numpages; p++ ) {
			paghtm += '<button class="btn btn-default btn-xs page_'+p+'" onclick="searches.goto('+p+')">'+p+'</button>';
		}
	}
	$('#pagination').html(paghtm);
}

Searches.prototype.goto = function(ct) {
	$("#pagination .btn").removeClass('active');	
	$("#pagination .page_"+ct).addClass('active');	

	start = (ct-1)*this.rowspp+1;
	end = ct*this.rowspp;
	if ( end > this.wsResp.results.length ) {
		end = this.wsResp.results.length;	
	}
	$("#viewing").html("Viewing "+start+"-"+end);
	renderedTempl  = render('templ-searchGroup',
		{title: this.wsResp.title,
			items: this.wsResp.results.slice(start-1,end),
			term: termhr,
			quarterDD: $('#availableQuarters').html(),
			career: $('#selectedCtext').html()
		 });
	$('#'+this.container).html(renderedTempl);
	this.disableConflictsInResults();
	 $("html, body").animate({ scrollTop: 0 }, "slow");
}


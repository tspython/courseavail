
function Course (cnbr,requireAllDetails) {
	myArr = localDB.select(cnbr,null,requireAllDetails);	

	try {
		for(var k=0;k<localDB.index.length;k++) {		
			this[localDB.index[k].toLowerCase()] = myArr[k];
			this[localDB.index[k]] = myArr[k];
		}
		if ( this.meetDays1 != '' ) {
			this.mtgsStr = this.meetDays1+' '+this.time1_fr+'-'+this.meetEndTm1;
	
			if ( this.meetDays2 != '' ) {
	
				this.mtgsStr += ' and '+this.meetDays2+' '+this.time2_fr+'-'+this.meetEndTm2;
			}
		} else {
			this.mtgsStr = '';
		}
	} catch(e) {
		if ( this.subject_descr == '' ) {
			this.subject_descr  = "(Not Found)";
		}
	}
	myArr= null;

}
 
Course.prototype.getID = function() {
	return this.sectionUID;	
}

Course.prototype.serialize = function() {
	return this.sectionUID;	
}

Course.prototype.isFull = function() {
	if ( this.seatsRemaining > 0 ) 
		return false;
	else
		return true;
}

Course.prototype.hr_units = function() {
	if ( this.minimumUnits == this.maximumUnits ) {
		return 	this.minimumUnits *1;
	} else {
		return (this.minimumUnits *1)	+'-'+(this.maximumUnits *1);
	}
	
}

Course.prototype.getString = function() {
	return this.subject + ' ' + this.catalogNbr;
}


Course.prototype.buildHTML = function(colorID) {

	if ( this.meetDays1 && this.meetDays1 != '' ) {
		this.dayBlocks(this.meetDays1, this.c_hrstart, this.c_mnstart, this.c_duration,this.time1_fr+'-'+this.meetEndTm1 ,colorID);
	}
	if ( this.meetDays2 && this.meetDays2 != '' ) {
		this.dayBlocks(this.meetDays2, this.c_hrstart2, this.c_mnstart2, this.c_duration2,this.time2_fr+'-'+this.meetEndTm2 ,colorID);
	}
	

	$('.nocourses').hide();

	this.colorID = colorID;
	renderedTempl  = render('templ-courseListItem', this);
	 $('.plan-courses').append(renderedTempl).fadeIn(400);


	
	goToState(3);	
}



Course.prototype.dayBlocks = function(days,hr,mn,dur,str,colorID) {
	if ( days ) {
		daysArr = days.split(",").map(element => {return element.trim();});
		for (i=0;i<daysArr.length;i++ )  {

			renderedTempl  = render('templ-courseCalendarBlock',
				{name: this.subject + ' ' + this.catalogNbr, 
					starthr: hr,
					sectionUID: this.sectionUID,
					startmn: mn,
					duration: dur,
					mtgstr: str,
					id: colorID
				 });
			$('#col_'+daysArr[i]).append(renderedTempl);

		}	
	}	
}

Course.prototype.isInWatchlist = function() {
	if ( watchlist.hasClassNumber(this.sectionUID) ) {
		return 1;
	} else {
		return '';
	}
}

Course.prototype.getConflictArray = function() {
	if ( typeof this.conflictArray == 'undefined') {			
		
		this.conflictArray = {};
		if ( this.meetDays1 && this.meetDays1 != '' ) {
			daysArr = this.meetDays1.split(",").map(element => {return element.trim();});
			begin = parseTime(this.meetStartTm1);
			end = parseTime(this.meetEndTm1);
			intBegin = ((begin.getHours()-0)*60)+ begin.getMinutes();
			intEnd = ((end.getHours()-0)*60)+ end.getMinutes();

			for( r=0; r < daysArr.length; r++) {

				if (  daysArr[r].trim() != '' ) {
					if ( !this.conflictArray.hasOwnProperty(daysArr[r]) ) 
						this.conflictArray[daysArr[r]] = [];
					this.conflictArray[daysArr[r]].push([intBegin,intEnd]);
				}
			}
		}

		if ( this.meetDays2 && this.meetDays2 != '' ) {
			daysArr =this.meetDays2.split(",").map(element => {return element.trim();});
			
			begin = parseTime(this.meetStartTm2);
			end = parseTime(this.meetEndTm2);
			intBegin = ((begin.getHours()-0)*60)+ begin.getMinutes();
			intEnd = ((end.getHours()-0)*60)+ end.getMinutes();
			
			for( r=0; r < daysArr.length; r++) {		
				if ( !this.conflictArray.hasOwnProperty(daysArr[r]) ) 
					this.conflictArray[daysArr[r]] = [];
				this.conflictArray[daysArr[r]].push([intBegin,intEnd]);
			}
		}

	}
	return this.conflictArray;
}

showDetails = function(sectionUID) {
	var sectionUID = typeof sectionUID !== 'undefined' ?  sectionUID : '' ;
	if ( sectionUID == '' ) 
		return;	
	course = new Course(sectionUID,true);

	htm = render('templ-courseDetails',course);	
	lb(htm);

	//buildInsetMap($('.featherlight-content #cdetailmap'),course.lat,course.long,course.mtg_facility_1);
	
	ws('search',course.subject+' '+course.catalognbr,function(data) {
		//returned data will contain the original course
		for (var i = 0; i<data.results.length; i++) {
			if ( data.results[i].sectionUID == course.sectionUID ) {
				data.results.splice(i,1);
				break;	
			}
		}
		if (data.results.length > 0 ) {
			$('.featherlight-content #alternates').html(render('templ-alternates',data));	
		}
	});
	return void(0);
}



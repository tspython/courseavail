function CustomBlock (title,days,si,ei) {
	this.title = title;
	this.dys = days;
	this.uid = getRandomInt(1000,9999);
	this.startInput = si;
	this.endInput = ei;

	//calculated fields
	this.starthr = '';
	this.mnstart = '';
	this.dur = '';
	
	this.error = '';
}	

CustomBlock.prototype.getID = function() {
	return this.uid;	
}
 
CustomBlock.prototype.serialize = function(humanReadable) {
	humanReadable = def(humanReadable,false);
	if (humanReadable ) { 
		return this.title + '('+ this.dys +',' + this.startInput +'-'+this.endInput+')';
	} else {
		return {title:this.title, days: this.dys, si:this.startInput, ei:this.endInput};	
	}
}
 
CustomBlock.prototype.isValid = function(returnErr) {
	errors = '';
	if ( this.title == '' ) {
		errors+= '<li>Please enter a title for the custom schedule item. ';
	}
	if ( this.dys == '' ) {
		errors+= '<li>Please select at least one day of the week. ';
	}
	st = parseTime(this.startInput );
	en = parseTime(this.endInput );
	if ( st == null) {
		errors+= '<li>Please enter a valid start time, such as "9am", "10:30am", or "1600" ';
	}
	if ( en == null) {
		errors+= '<li>Please enter a valid end time, such as "9am", "10:30am", or "1600" ';
	}
	if ( st >= en) {
		errors+= '<li>Start time must be before ending time.';
	}
	if (errors != '' ) {
		if (returnErr) {
			return errors;	
		}
		$('#cbErrors').html('<ul>'+errors+'</ul>');
		$('#cbErrors').show();	
		return false;	
	}


	this.calculateFields();

	myCA = this.getConflictArray();
	conflicts = plans.getCurrent().getTimeConflicts(myCA);

	if ( conflicts != '' ) {
		if (returnErr) {
			return (" conflicts with the following items: <ul>"+conflicts+"</ul>");	
		}
		$('#cbErrors').html("Cannot add this block because it conflicts with the following items in the current schedule: <ul>"+conflicts+"</ul>");
		$('#cbErrors').show();	
		return false;	
	}
	if (returnErr) {
		return '';	
	}
	
	return true;
}

CustomBlock.prototype.calculateFields = function() {
	this.starttime = parseTime(this.startInput);
	this.endtime = parseTime(this.endInput);

	this.starthr = this.starttime.getHours();
	this.mnstart = this.starttime.getMinutes();
	this.mnend = this.starttime.getMinutes();

	//round to nearest 5 min
	if (this.mnstart > 57) {
		this.mnstart = 0;	
		this.starthr++;
		this.starttime.setHours(this.mnstart);
		this.starttime.setMinutes(this.mnstart);
	} else {
		this.mnstart = this.mnstart - (this.mnstart%5);	
		this.starttime.setMinutes(this.mnstart);
	}

	this.dur = (this.endtime-this.starttime)/1000/60;
}

CustomBlock.prototype.getConflictArray = function() {
	if ( typeof this.conflictArray == 'undefined') {
		
		if ( this.dys == '' ) {
			return {};	
		}
		
		this.conflictArray = {};
		daysArr = this.dys.split(",").map(element => {return element.trim();});
		begin = this.starttime;
		end = this.endtime;
		intBegin = ((begin.getHours()-0)*60)+ begin.getMinutes();
		intEnd = ((end.getHours()-0)*60)+ end.getMinutes();
		
		for( r=0; r < daysArr.length; r++) {		
			if ( !this.conflictArray.hasOwnProperty(daysArr[r]) ) 
				this.conflictArray[daysArr[r]] = [];
			this.conflictArray[daysArr[r]].push([intBegin,intEnd]);
		}

	}
	return this.conflictArray;
}


CustomBlock.prototype.buildHTML = function(colorID) {
	this.calculateFields();
	
	data = {name: this.title, 
				uid: this.uid,
				dys: this.dys,
				starthr: this.starthr,
				startmn: this.mnstart,
				duration: this.dur,
				id: colorID,
				si: this.startInput,
				ei:this.endInput
			 };
			 
	daysArr = this.dys.split(",").map(element => {return element.trim();});
	for (i=0;i<daysArr.length;i++ )  {
		if ( daysArr[i] != ',' && $('#col_'+daysArr[i]).length > 0 ) {
			renderedTempl  = render('templ-cbCalendarBlock',data);
			$('#col_'+daysArr[i]).append(renderedTempl);
		}
	}

	$('.nocourses').hide();

	renderedTempl  = render('templ-cbListItem',data);
	
	 $('.plan-courses').append(renderedTempl).fadeIn(400);
	
	goToState(3);
	
}
